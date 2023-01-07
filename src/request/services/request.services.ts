import { Request, Response } from "express";
import { User } from "../../user/entities/user.entity";
import { Team } from "../../team/entities/team.entity";
import { Brackets, getCustomRepository, Not } from "typeorm";
import { Event, EventStatus } from "../../event/entities/event.entity";
import { UserRepository } from "../../user/repositories/user.repository";
import { RequestRepository } from "../repositories/request.repository";
import { TeamRepository } from "../../team/repositories/team.repository";
import { StatisticsService } from "../../team/services/statistics.services";
import { EventRepository } from "../../event/repositories/event.repository";
import { Request as Invitation, RequestStatus } from "../entities/request.entity";
import { NotificationType } from "../../notifications/entities/notification.entity";
import { TeamUsersRepository } from "../../team/repositories/team.users.repository";
import { NotificationService } from "../../notifications/services/notification.services";
import { UserService } from "../../user/services/user.service";

export class RequestService {
  static listPossibleUsersForEvent = async (event: Event, request: Request, response: Response) => {
    const usersRepository = getCustomRepository(UserRepository);
    const teamsUsersRepository = getCustomRepository(TeamUsersRepository);
    const eventRepository = getCustomRepository(EventRepository);
    const sport = event.sport;
    const possibleUsers = usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.receivedReviews", "review")
      .where(`user.sports LIKE '%"${sport}": {"picked": true%'`)
      .andWhere(`user.id NOT IN (select receiverId from requests where eventId = ${event.id} )`);

    let userQb = `(user.sports `;

    if (request.body.positions?.length) {
      request.body.positions.forEach((position, _index) => {
        if (_index === 0) {
          userQb += `LIKE '%${position}%' `;
        } else userQb += ` OR '%${position}%' `;
      });
      userQb += ")";
      possibleUsers.andWhere(userQb);
    }

    if (request.body.level) {
      const level = request.body.level;
      possibleUsers.andWhere(`user.sports LIKE '%${level}%'`);
    }

    if (request.body.rating) {
      possibleUsers.andWhere(
        `(SELECT SUM(review.value)/COUNT(review.id) AS averageRating group by review.receiverId, review.sport having averageRating >= ${request.body.rating.minRating} and averageRating <= ${request.body.rating.maxRating})`
      );
    }

    if (request.body.playedBefore === true) {
      const myTeams = await teamsUsersRepository
        .createQueryBuilder("tu")
        .select("tu.teamId")
        .where("tu.playerId = :userId", { userId: response.locals.jwt.userId })
        .getMany();

      const myTeamsMapped = myTeams.map((el) => el.teamId);

      const usersPlayedBefore = await eventRepository
        .createQueryBuilder("e")
        .select("DISTINCT u.id")
        .innerJoin("teams_users", "tu", "e.organiserTeamId = tu.teamId OR e.receiverTeamId = tu.teamId")
        .innerJoin("event_teams_users", "etu", "tu.id = etu.teamUserId and e.id = etu.eventId")
        .innerJoin("users", "u", "u.id = tu.playerId")
        .where("e.status = :status", { status: EventStatus.COMPLETED })
        .andWhere(`tu.teamId NOT IN (${myTeamsMapped})`)
        .andWhere(`(e.receiverTeamId IN (${myTeamsMapped}) or e.organiserTeamId IN (${myTeamsMapped}))`)
        .getRawMany();

      const usersPlayedBeforeMapped = usersPlayedBefore.map((el) => el.id);

      possibleUsers.andWhere(`user.id IN (${usersPlayedBeforeMapped})`);
    }

    return possibleUsers.getMany();
  };

  static listInvitationsForEvent = async (event: Event, request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const requests = requestRepository
      .createQueryBuilder("request")
      .innerJoinAndSelect("request.receiver", "receiver")
      .where("request.eventId = :eventId", { eventId: event.id })
      .andWhere("request.senderId != request.receiverId")
      .getMany();

    return requests;
  };

  static inviteUser = async (event: Event, user: User, request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);

    const senderId = +response.locals.jwt.userId;
    const payload = {
      senderId: senderId,
      receiverId: user.id,
      eventId: event.id,
      sport: event.sport,
      status: RequestStatus.WAITING_FOR_CONFIRMATION,
    };

    const createdRequest = requestRepository.create(payload);
    await requestRepository.save(createdRequest);

    await NotificationService.createRequestNotification(
      user.id,
      NotificationType.INVITATION_TO_EVENT,
      event.id,
      event.name,
      user.pushToken
    );

    return createdRequest;
  };

  static requestToEnter = async (event: Event, creator: User, request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const receiverId = +response.locals.jwt.userId;

    const payload = {
      senderId: event.creatorId,
      receiverId: receiverId,
      eventId: event.id,
      sport: event.sport,
      status: RequestStatus.WAITING_FOR_CONFIRMATION,
      isRequest: true,
    };

    const createdRequest = requestRepository.create(payload);
    await requestRepository.save(createdRequest);

    await NotificationService.createRequestNotification(
      receiverId,
      NotificationType.REQUEST_TO_EVENT,
      event.id,
      event.name,
      creator.pushToken
    );

    return createdRequest;
  };

  static teamRequestToEnter = async (event: Event, team: Team, request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const payload = {
      senderTeamId: event.organiserTeamId,
      receiverTeamId: team.id,
      eventId: event.id,
      sport: event.sport,
      status: RequestStatus.WAITING_FOR_CONFIRMATION,
      isRequest: true,
    };

    const createdRequest = requestRepository.create(payload);
    await requestRepository.save(createdRequest);

    const teamRepository = getCustomRepository(TeamRepository);
    const creatorTeam = await teamRepository
      .createQueryBuilder("team")
      .leftJoinAndSelect("team.user", "u")
      .where("team.id = :id", { id: event.organiserTeamId })
      .getOne();

    await NotificationService.createRequestNotification(
      event.organiserTeamId,
      NotificationType.TEAM_REQUEST_TO_EVENT,
      event.id,
      event.name,
      creatorTeam.user.pushToken,
      team.name
    );

    return createdRequest;
  };

  static findById = async (requestId: number) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const request = await requestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.event", "e")
      .leftJoinAndSelect("request.receiver", "r")
      .where("request.id = :id", { id: requestId })
      .getOne();
    return request;
  };

  static deleteById = async (request: Invitation) => {
    const requestRepository = getCustomRepository(RequestRepository);
    await requestRepository.delete(request.id);

    await NotificationService.createRequestNotification(
      request.receiver.id,
      NotificationType.INVITATION_DELETED,
      request.event.id,
      request.event.name,
      request.receiver.pushToken
    );
  };

  static updateRequest = async (requestPayload, originalRequest: Invitation, request: Request) => {
    const requestRepository = getCustomRepository(RequestRepository);
    let requestToBeConfirmed = false;
    let requestToBeRefused = false;
    if (
      originalRequest.status === RequestStatus.WAITING_FOR_CONFIRMATION &&
      requestPayload.status === RequestStatus.CONFIRMED
    ) {
      requestToBeConfirmed = true;
    }
    if (
      originalRequest.status === RequestStatus.WAITING_FOR_CONFIRMATION &&
      requestPayload.status === RequestStatus.REFUSED
    ) {
      requestToBeRefused = true;
    }
    const mergedRequest = requestRepository.merge(originalRequest, requestPayload);
    const updatedRequest = await requestRepository.save(mergedRequest);

    if (requestToBeConfirmed === true && updatedRequest.status === RequestStatus.CONFIRMED) {
      if (originalRequest.isRequest) {
        const invitedUser = await UserService.findOne(originalRequest.receiverId);

        await NotificationService.createRequestNotification(
          originalRequest.receiverId,
          NotificationType.CREATOR_CONFIRMED_REQUEST,
          updatedRequest.event.id,
          updatedRequest.event.name,
          invitedUser.pushToken
        );
      } else {
        const creator = await UserService.findOne(originalRequest.event.creatorId);

        await NotificationService.createRequestNotification(
          originalRequest.receiverId,
          NotificationType.USER_CONFIRMED_REQUEST,
          updatedRequest.event.id,
          updatedRequest.event.name,
          creator.pushToken,
          "",
          updatedRequest.receiver.name
        );
      }
    }

    if (requestToBeRefused === true && updatedRequest.status === RequestStatus.REFUSED) {
      if (originalRequest.isRequest) {
        const invitedUser = await UserService.findOne(originalRequest.receiverId);

        await NotificationService.createRequestNotification(
          originalRequest.receiverId,
          NotificationType.CREATOR_REFUSED_REQUEST,
          updatedRequest.event.id,
          updatedRequest.event.name,
          invitedUser.pushToken
        );
      } else {
        const creator = await UserService.findOne(originalRequest.event.creatorId);

        await NotificationService.createRequestNotification(
          originalRequest.receiverId,
          NotificationType.USER_REFUSED_REQUEST,
          updatedRequest.event.id,
          updatedRequest.event.name,
          creator.pushToken,
          "",
          updatedRequest.receiver.name
        );
      }
    }
    return "Request successfully updated!";
  };

  static listPossibleTeamsForEvent = async (event: Event, request: Request, response: Response) => {
    const teamsRepository = getCustomRepository(TeamRepository);
    const eventRepository = getCustomRepository(EventRepository);
    const requestRepository = getCustomRepository(RequestRepository);
    const sport = event.sport;
    const sportsMapped = {
      football: "Futboll",
      basketball: "Basketboll",
      tenis: "Tenis",
      voleyball: "Volejboll",
    };

    const requests = await requestRepository
      .createQueryBuilder("request")
      .innerJoinAndSelect("request.receiverTeam", "receiverTeam")
      .where("request.eventId = :eventId", { eventId: event.id })
      .andWhere("request.status IN (:statuses)", {
        statuses: [RequestStatus.CONFIRMED, RequestStatus.WAITING_FOR_CONFIRMATION],
      })
      .getMany();

    const invitedTeamIds = requests.map((invitedTeam) => invitedTeam.receiverTeam.id).concat(-1);

    const possibleTeams = teamsRepository
      .createQueryBuilder("team")
      .where("team.sport = :sport", { sport: sportsMapped[sport] })
      .andWhere("team.isDummy = false")
      .andWhere("team.id != :organiserTeamId", {
        organiserTeamId: event.organiserTeamId,
      })
      .andWhere("team.id NOT IN (:...invitedTeams)", { invitedTeams: invitedTeamIds });

    if (request.body.level) {
      possibleTeams.andWhere("team.level = :level", {
        level: request.body.level,
      });
    }

    if (request.body.ageRange) {
      possibleTeams.andWhere("team.ageRange = :ageRange", {
        ageRange: request.body.ageRange,
      });
    }

    if (request.body.playedBefore === true) {
      const playedBeforeTeams = await eventRepository
        .createQueryBuilder("event")
        .select("event.organiserTeamId, event.receiverTeamId")
        .where("event.isTeam = true")
        .andWhere("event.status = :status", { status: EventStatus.COMPLETED })
        .andWhere(
          new Brackets((qb) => {
            qb.where("event.organiserTeamId = :organiserTeamId", {
              organiserTeamId: event.organiserTeamId,
            }).orWhere("event.receiverTeamId = :receiverTeamId", {
              receiverTeamId: event.organiserTeamId,
            });
          })
        )
        .getRawMany();

      const playedBeforeTeamsMapped = playedBeforeTeams.map((el) =>
        el.organiserTeamId === event.organiserTeamId ? el.receiverTeamId : el.organiserTeamId
      );
      possibleTeams.andWhere("team.id IN (:playedBeforeTeamsMapped)", {
        playedBeforeTeamsMapped,
      });
    }

    const results = await possibleTeams.getMany();

    const possibleTeamsIds = results.map((team) => team.id);

    let possibleTeamWins = [];
    let possibleTeamLoses = [];
    let possibleTeamDraws = [];
    if (results.length) {
      possibleTeamWins = await StatisticsService.getWins(possibleTeamsIds);
      possibleTeamLoses = await StatisticsService.getLoses(possibleTeamsIds);
      possibleTeamDraws = await StatisticsService.getDraws(possibleTeamsIds);
    }

    const possibleTeamsWinsMapped = {};
    if (possibleTeamWins.length) {
      for (const win of possibleTeamWins) {
        possibleTeamsWinsMapped[win.winnerId] = win;
      }
    }

    const possibleTeamsLosesMapped = {};
    if (possibleTeamLoses.length) {
      for (const lose of possibleTeamLoses) {
        possibleTeamsLosesMapped[lose.loserId] = lose;
      }
    }

    const possibleTeamsDrawsMapped = {};
    if (possibleTeamDraws.length) {
      for (const draw of possibleTeamDraws) {
        if (!possibleTeamsDrawsMapped[draw.organiser]) possibleTeamsDrawsMapped[draw.organiser] = 0;
        possibleTeamsDrawsMapped[draw.organiser] += 1;
        if (!possibleTeamsDrawsMapped[draw.receiver]) possibleTeamsDrawsMapped[draw.receiver] = 0;
        possibleTeamsDrawsMapped[draw.receiver] += 1;
      }
    }

    return results.map((possibleTeam) => ({
      ...possibleTeam.toResponseObject,
      wins: +(possibleTeamsWinsMapped[possibleTeam.id]?.wins ?? 0),
      loses: +(possibleTeamsLosesMapped[possibleTeam.id]?.wins ?? 0),
      draws: possibleTeamsDrawsMapped[possibleTeam.id] ?? 0,
    }));
  };

  static listTeamsInvitationsForEvent = async (event: Event, request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const requests = await requestRepository
      .createQueryBuilder("request")
      .innerJoinAndSelect("request.receiverTeam", "receiverTeam")
      .innerJoinAndSelect("receiverTeam.players", "players")
      .innerJoinAndSelect("players.player", "p")
      .where("request.eventId = :eventId", { eventId: event.id })
      .getMany();

    const invitedTeamIds = requests.map((invitedTeam) => invitedTeam.receiverTeam.id);

    let invitedTeamsWins = [];
    let invitedTeamsLoses = [];
    let invitedTeamsDraws = [];
    if (requests.length) {
      invitedTeamsWins = await StatisticsService.getWins(invitedTeamIds);
      invitedTeamsLoses = await StatisticsService.getLoses(invitedTeamIds);
      invitedTeamsDraws = await StatisticsService.getDraws(invitedTeamIds);
    }

    const invitedTeamsWinsMapped = {};
    if (invitedTeamsWins.length) {
      for (const win of invitedTeamsWins) {
        invitedTeamsWinsMapped[win.winnerId] = win;
      }
    }

    const invitedTeamsLosesMapped = {};
    if (invitedTeamsLoses.length) {
      for (const lose of invitedTeamsLoses) {
        invitedTeamsLosesMapped[lose.loserId] = lose;
      }
    }

    const invitedTeamsDrawsMapped = {};
    if (invitedTeamsDraws.length) {
      for (const draw of invitedTeamsDraws) {
        if (!invitedTeamsDrawsMapped[draw.organiser]) invitedTeamsDrawsMapped[draw.organiser] = 0;
        invitedTeamsDrawsMapped[draw.organiser] += 1;
        if (!invitedTeamsDrawsMapped[draw.receiver]) invitedTeamsDrawsMapped[draw.receiver] = 0;
        invitedTeamsDrawsMapped[draw.receiver] += 1;
      }
    }

    return requests.map((request) => {
      return {
        ...request,
        receiverTeam: {
          ...request.receiverTeam.toResponseWithPlayers,
          wins: +(invitedTeamsWinsMapped[request.receiverTeam.id]?.wins ?? 0),
          loses: +(invitedTeamsLosesMapped[request.receiverTeam.id]?.wins ?? 0),
          draws: invitedTeamsDrawsMapped[request.receiverTeam.id] ?? 0,
        },
      };
    });
  };

  static inviteTeam = async (event: Event, team: Team, request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const payload = {
      senderTeamId: event.organiserTeamId,
      receiverTeamId: team.id,
      eventId: event.id,
      sport: event.sport,
      status: RequestStatus.WAITING_FOR_CONFIRMATION,
    };

    const createdRequest = requestRepository.create(payload);
    await requestRepository.save(createdRequest);

    const teamRepository = getCustomRepository(TeamRepository);
    const invitedTeam = await teamRepository
      .createQueryBuilder("team")
      .leftJoinAndSelect("team.user", "u")
      .where("team.id = :id", { id: event.organiserTeamId })
      .getOne();

    await NotificationService.createRequestNotification(
      team.id,
      NotificationType.TEAM_INVITED_TO_EVENT,
      event.id,
      event.name,
      invitedTeam.user.pushToken,
      team.name
    );

    return createdRequest;
  };
}
