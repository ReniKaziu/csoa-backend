import { Request, Response } from "express";
import { Team } from "../entities/team.entity";
import { User } from "../../user/entities/user.entity";
import { getCustomRepository, getRepository } from "typeorm";
import { UserRepository } from "../../user/repositories/user.repository";
import { TeamUsers, TeamUserStatus } from "../entities/team.users.entity";
import { TeamUsersRepository } from "../repositories/team.users.repository";
import { NotificationType } from "../../notifications/entities/notification.entity";
import { NotificationService } from "../../notifications/services/notification.services";

export class TeamUsersService {
  static listPossiblePlayers = async (team: Team, request: Request, response: Response) => {
    const usersRepository = getCustomRepository(UserRepository);
    const sport = team.sport;
    const sportsMapped = {
      Futboll: "football",
      Basketboll: "basketball",
      Tenis: "tenis",
      Volejboll: "voleyball",
    };

    const possibleUsers = usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.receivedReviews", "review")
      .where(`user.sports LIKE '%"${sportsMapped[sport]}":{"picked":true%'`)
      .andWhere(`user.id NOT IN (select playerId from teams_users where teamId = ${team.id} and ts_deleted IS NULL )`);

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

    // if (request.body.playedBefore === true) {
    //   const myTeams = await teamsUsersRepository
    //     .createQueryBuilder("tu")
    //     .select("tu.teamId")
    //     .where("tu.playerId = :userId", { userId: response.locals.jwt.userId })
    //     .getMany();

    //   const myTeamsMapped = myTeams.map((el) => el.teamId);

    //   const usersPlayedBefore = await eventRepository
    //     .createQueryBuilder("e")
    //     .select("DISTINCT u.id")
    //     .innerJoin("teams_users", "tu", "e.organiserTeamId = tu.teamId OR e.receiverTeamId = tu.teamId")
    //     .innerJoin("event_teams_users", "etu", "tu.id = etu.teamUserId and e.id = etu.eventId")
    //     .innerJoin("users", "u", "u.id = tu.playerId")
    //     .where("e.status = :status", { status: EventStatus.COMPLETED })
    //     .andWhere(`tu.teamId NOT IN (${myTeamsMapped})`)
    //     .andWhere(`(e.receiverTeamId IN (${myTeamsMapped}) or e.organiserTeamId IN (${myTeamsMapped}))`)
    //     .getRawMany();

    //   const usersPlayedBeforeMapped = usersPlayedBefore.map((el) => el.id);

    //   possibleUsers.andWhere(`user.id IN (${usersPlayedBeforeMapped})`);
    // }

    return possibleUsers.getMany();
  };

  static inviteUser = async (team: Team, user: User, request: Request, response: Response) => {
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    const payload = {
      sport: team.sport,
      isConfirmed: false,
      playerId: user.id,
      teamId: team.id,
      status: TeamUserStatus.WAITING_FOR_CONFIRMATION,
    };

    const createdInvitation = teamUsersRepository.create(payload);
    await teamUsersRepository.save(createdInvitation);

    await NotificationService.createTeamUserNotification(
      user.id,
      NotificationType.INVITATION_TO_TEAM,
      team.name,
      team.id,
      user.pushToken
    );

    return createdInvitation;
  };

  static listInvitationsForTeam = async (team: Team, request: Request, response: Response) => {
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);
    const invitations = await teamUsersRepository
      .createQueryBuilder("tu")
      .innerJoinAndSelect("tu.player", "p")
      .where("tu.teamId = :teamId", { teamId: team.id })
      .andWhere("tu.status IN (:...statuses)", {
        statuses: [TeamUserStatus.WAITING_FOR_CONFIRMATION, TeamUserStatus.CONFIRMED],
      })
      .getMany();

    return invitations.map((invitation) => invitation.toResponse);
  };

  static findOne = async (teamUserId: number) => {
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    const teamUser = await teamUsersRepository
      .createQueryBuilder("tu")
      .where("tu.id = :id", { id: teamUserId })
      .getOne();

    return teamUser;
  };

  static getOne = async (teamUserId: number) => {
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    const teamUser = await teamUsersRepository
      .createQueryBuilder("tu")
      .leftJoinAndSelect("tu.team", "t")
      .leftJoinAndSelect("t.user", "u")
      .leftJoinAndSelect("tu.player", "p")
      .where("tu.id = :id", { id: teamUserId })
      .getOne();

    return teamUser;
  };

  static updateInvitation = async (invitationPayload, teamUser: TeamUsers, request: Request) => {
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);
    let invitationToBeConfirmed = false;
    let invitationToBeRefused = false;
    if (
      teamUser.status === TeamUserStatus.WAITING_FOR_CONFIRMATION &&
      invitationPayload.status === TeamUserStatus.CONFIRMED
    ) {
      invitationToBeConfirmed = true;
    }
    if (
      teamUser.status === TeamUserStatus.WAITING_FOR_CONFIRMATION &&
      invitationPayload.status === TeamUserStatus.REFUSED
    ) {
      invitationToBeRefused = true;
    }
    const mergedInvitation = teamUsersRepository.merge(teamUser, invitationPayload);
    const updatedInvitation = await teamUsersRepository.save(mergedInvitation);

    if (invitationToBeConfirmed === true && updatedInvitation.status === TeamUserStatus.CONFIRMED) {
      await NotificationService.createTeamUserNotification(
        teamUser.team.userId,
        NotificationType.INVITATION_TO_TEAM_CONFIRMED,
        teamUser.team.name,
        teamUser.teamId,
        teamUser.team.user.pushToken,
        teamUser.player.name
      );
    }
    if (invitationToBeRefused === true && updatedInvitation.status === TeamUserStatus.REFUSED) {
      await NotificationService.createTeamUserNotification(
        teamUser.team.userId,
        NotificationType.INVITATION_TO_TEAM_REFUSED,
        teamUser.team.name,
        teamUser.teamId,
        teamUser.team.user.pushToken,
        teamUser.player.name
      );
    }
    return "Request successfully updated!";
  };

  static deleteById = async (teamUser: TeamUsers) => {
    const teamUserRepository = getRepository(TeamUsers);
    await teamUserRepository.softDelete(teamUser.id);

    if (teamUser.status === TeamUserStatus.CONFIRMED) {
      await NotificationService.createTeamUserNotification(
        teamUser.team.userId,
        NotificationType.USER_EXITED_TEAM,
        teamUser.team.name,
        teamUser.teamId,
        teamUser.team.user.pushToken,
        teamUser.player.name
      );
    }
  };
}
