import { query, Request, Response } from "express";
import { Brackets, getCustomRepository, getManager, getRepository, Not } from "typeorm";
import { Functions } from "../../common/utilities/Functions";
import { RequestStatus } from "../../request/entities/request.entity";
import { UserService } from "../../user/services/user.service";
import { Event, EventStatus } from "../entities/event.entity";
import { EventRepository } from "../repositories/event.repository";
import { TeamUsers } from "../../team/entities/team.users.entity";
import { RequestRepository } from "../../request/repositories/request.repository";
import { TeamRepository } from "../../team/repositories/team.repository";
import { CreateEventDto } from "../dto/create-event.dto";
import { WeeklyEventGroup } from "../entities/weekly.event.group.entity";
import { WeeklyEventGroupRepository } from "../repositories/weekly.event.group.repository";
import { UserRole } from "../../user/utilities/UserRole";
import { NotificationService } from "../../notifications/services/notification.services";
import { User } from "../../user/entities/user.entity";
import { NotificationType } from "../../notifications/entities/notification.entity";
import { UserRepository } from "../../user/repositories/user.repository";
import { TeamUsersRepository } from "../../team/repositories/team.users.repository";
import { EventTeamUsersRepository } from "../repositories/event.team.users.repository";
import { EventTeamUsers } from "../entities/event.team.users.entity";

export class EventService {
  static listMyEvents = async (request: Request, response: Response) => {
    const eventsRepository = getCustomRepository(EventRepository);
    const teamUsersRepository = getRepository(TeamUsers);

    const date = Functions.getCurrentDateTime();
    let oneDayLater = Functions.formatOneDayLaterDate(new Date());
    const userId = +response.locals.jwt.userId;
    const user = await UserService.findOne(userId);
    const age = Functions.getAge(user.birthday);

    let mySports = [];
    for (const sport in user.sports as any) {
      if (user.sports[sport].picked) {
        mySports.push(sport);
      }
    }

    const myTeams = await teamUsersRepository.find({
      where: {
        playerId: response.locals.jwt.userId,
      },
      relations: ["team"],
    });

    let myTeamsIds = myTeams.filter((player) => player.team).map((player) => player.team.id);
    myTeamsIds = myTeamsIds.length ? myTeamsIds : [-1];

    const queryBuilder = eventsRepository
      .createQueryBuilder("event")
      .leftJoin("event.eventRequests", "request", "request.eventId = event.id AND request.status = 'confirmed'")
      .leftJoinAndSelect("event.location", "location")
      .leftJoinAndSelect("location.complex", "complex")
      .leftJoinAndSelect("event.organiserTeam", "senderTeam")
      .leftJoinAndSelect("event.receiverTeam", "receiverTeam")
      .withDeleted()
      .where("event.status IN (:...statuses)", {
        statuses: [
          EventStatus.DRAFT,
          EventStatus.WAITING_FOR_CONFIRMATION,
          EventStatus.CONFIRMED,
          EventStatus.COMPLETED,
          EventStatus.REFUSED,
        ],
      })
      .andWhere("event.startDate > :todayStart", {
        todayStart: date,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("request.receiverId = :id", { id: userId })
            .orWhere("request.senderId = :id", { id: userId })
            .orWhere("request.senderTeamId IN (:...myTeamsIds)", { myTeamsIds })
            .orWhere("request.receiverTeamId IN (:...myTeamsIds)", {
              myTeamsIds,
            });
        })
      );

    if (request.query && request.query.todayEvents === "true") {
      queryBuilder.andWhere("event.startDate < :todayEnd", {
        todayEnd: oneDayLater + " 03:59:59",
      });
    }

    const myEvents = await queryBuilder.getMany();
    const myEventIds = myEvents.map((event) => event.id).concat(-1);

    const qb = eventsRepository
      .createQueryBuilder("event")
      .leftJoin("event.eventRequests", "request")
      .leftJoinAndSelect("event.location", "location")
      .leftJoinAndSelect("location.complex", "complex")
      .leftJoinAndSelect("event.organiserTeam", "senderTeam")
      .leftJoinAndSelect("event.receiverTeam", "receiverTeam")
      .where("event.sport IN (:...mySports)", {
        mySports: mySports.length ? mySports : [-1],
      })
      .andWhere("event.isPublic = :public", { public: true })
      .andWhere("event.status IN (:...statuses)", {
        statuses: [EventStatus.CONFIRMED, EventStatus.WAITING_FOR_CONFIRMATION],
      })
      .andWhere("event.startDate > :todayStart", {
        todayStart: date,
      })
      .andWhere("event.minAge < :age", { age })
      .andWhere("event.maxAge > :age", { age })
      .andWhere("complex.city = :userCity", { userCity: user.address })
      .andWhere(
        new Brackets((qb) => {
          qb.where("request.receiverId != :receiverId", {
            receiverId: userId,
          });
          qb.orWhere("request.receiverId IS NULL");
        })
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where("request.senderId != :senderId", {
            senderId: userId,
          });
          qb.orWhere("request.senderId IS NULL");
        })
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where("request.senderTeamId NOT IN (:...senderTeamIds)", {
            senderTeamIds: myTeamsIds,
          });
          qb.orWhere("request.senderTeamId IS NULL");
        })
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where("request.receiverTeamId NOT IN (:...receiverTeamIds)", {
            receiverTeamIds: myTeamsIds,
          });
          qb.orWhere("request.receiverTeamId IS NULL");
        })
      )
      .andWhere("event.id NOT IN (:...myEventIds)", { myEventIds });

    const qbPage = +request.query.page >= 1 ? +request.query.page - 1 : 0;

    qb.limit(15);
    qb.offset(qbPage * 15);

    const publicEvents = await qb.getManyAndCount();

    let hasNextPage = true;
    const page = +request.query.page >= 1 ? +request.query.page : 1;

    if (publicEvents[1] <= page * 15) {
      hasNextPage = false;
    }

    const myEventsMap = {};
    const myEventsWeekly = [];

    for (const myEvent of myEvents) {
      if (myEvent.weeklyGroupedId) {
        if (!myEventsMap[myEvent.weeklyGroupedId]) {
          myEventsMap[myEvent.weeklyGroupedId] = 1;
          myEventsWeekly.push(myEvent);
        } else if (myEventsMap[myEvent.weeklyGroupedId] < 3) {
          myEventsMap[myEvent.weeklyGroupedId] += 1;
          myEventsWeekly.push(myEvent);
        }
      }
    }

    const myEventsWithoutWeekly = myEvents.filter((event) => event.weeklyGroupedId === null);

    const myEventsResults = myEventsWithoutWeekly.concat(myEventsWeekly)?.sort((a, b) => {
      return a.startDate > b.startDate ? 1 : -1;
    });

    const publicEventsMap = {};
    const publicEventsWeekly = [];

    for (const publicEvent of publicEvents[0]) {
      if (publicEvent.weeklyGroupedId) {
        if (!publicEventsMap[publicEvent.weeklyGroupedId]) {
          publicEventsMap[publicEvent.weeklyGroupedId] = 1;
          publicEventsWeekly.push(publicEvent);
        } else if (publicEventsMap[publicEvent.weeklyGroupedId] < 3) {
          publicEventsMap[publicEvent.weeklyGroupedId] += 1;
          publicEventsWeekly.push(publicEvent);
        }
      }
    }

    const publicEventsWithoutWeekly = publicEvents[0].filter((event) => event.weeklyGroupedId === null);

    const publicEventsResults = publicEventsWithoutWeekly.concat(publicEventsWeekly)?.sort((a, b) => {
      return a.startDate > b.startDate ? 1 : -1;
    });

    console.log({ lengh: publicEventsResults.length });

    const responseData = {
      myEvents: myEventsResults.map((event) => event.toResponse),
      publicEvents: publicEventsResults.map((event) => event.toResponse),
      hasNextPage,
    };

    return responseData;
  };

  static list = async (request: Request, response: Response) => {
    const eventRepository = getRepository(Event);
    const count = await eventRepository.count({ withDeleted: true });
    const events = await eventRepository
      .createQueryBuilder("e")
      .select([
        "u.name as creator",
        "startDate",
        "sport",
        "c.name as name",
        "e.id as id",
        "e.tsDeleted as tsDeleted",
        "e.status as status",
        "e.isDraw as isDraw",
        "e.winnerTeamId as winnerTeamId",
        "e.loserTeamId as loserTeamId",
        "l.name as location",
        "e.ts_Created as tsCreated",
        "u.email as email",
        "u.phoneNumber as phoneNumber",
      ])
      .innerJoin("locations", "l", "l.id = e.locationId")
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .leftJoin("users", "u", "u.id = e.creatorId")
      .where("(e.isDraft is null OR e.isDraft = 0)")
      .andWhere("u.role = :role", { role: UserRole.USER })
      .orderBy("e.ts_Created", "DESC")
      .withDeleted()
      .limit(15)
      .offset(+request.query.page * 15)
      .getRawMany();
    return {
      count,
      events,
    };
  };

  static getPlayers = async (request: Request, response: Response) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const teamPlayers = await requestRepository
      .createQueryBuilder("r")
      .select("u.name, u.profile_picture, t.name as team, r.status")
      .innerJoin("teams", "t", "t.id = r.senderTeamId OR t.id = r.receiverTeamId")
      .innerJoin("teams_users", "tu", "tu.teamId = t.id")
      .innerJoin("users", "u", "u.id = tu.playerId")
      .where("r.eventId = :id", { id: request.params.id })
      .getRawMany();

    if (teamPlayers.length) return teamPlayers;

    return requestRepository
      .createQueryBuilder("r")
      .select("u.name, u.profile_picture")
      .innerJoin("users", "u", "u.id = r.receiverId OR u.id = r.senderId")
      .where("r.eventId = :id", { id: request.params.id })
      .getRawMany();
  };

  static async createAdminEvent(request: Request, response: Response) {
    const {
      body: { startDate, endDate, notes, name, locationId, sport, status, isWeekly, phoneNumber, organiserPhone },
    } = request;
    if (new Date(startDate) < new Date()) {
      throw new Error("Ora e eventit nuk mund te jete ne te shkuaren!");
    }

    const queryRunner = getManager().connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let createdEvent: any = false;
      let eventsToBeInserted = [];
      for (let i = 0; i <= (isWeekly ? 11 : 0); i++) {
        const incrementedStartDate = EventService.addDays(startDate, i);
        const incrementedEndDate = EventService.addDays(endDate, i);
        const overlappingEvent = await queryRunner.manager
          .createQueryBuilder()
          .from("events", "e")
          .where(`e.locationId = '${locationId}'`)
          .andWhere("e.status NOT IN (:...statuses)", {
            statuses: [EventStatus.DRAFT, EventStatus.CANCELED, EventStatus.REFUSED],
          })
          .andWhere(
            new Brackets((qb) => {
              qb.where(
                `(e.startDate < '${incrementedEndDate.toISOString()}' AND e.endDate > '${incrementedStartDate.toISOString()}')`
              );
              qb.orWhere(
                `(e.startDate = '${incrementedStartDate.toISOString()}' AND e.endDate = '${incrementedEndDate.toISOString()}')`
              );
            })
          )
          .andWhere("e.ts_deleted IS NULL")
          .setLock("pessimistic_read")
          .getRawOne();

        if (!overlappingEvent) {
          const event = new CreateEventDto();
          event.startDate = incrementedStartDate;
          event.endDate = incrementedEndDate;
          event.isUserReservation = false;
          event.creatorId = response.locals.jwt.userId;
          event.notes = notes;
          event.name = name;
          event.locationId = locationId;
          event.sport = sport;
          event.status = status ?? EventStatus.WAITING_FOR_CONFIRMATION;
          event.isWeekly = isWeekly ? true : false;
          event.phoneNumber = phoneNumber;
          event.organiserPhone = organiserPhone;
          eventsToBeInserted.push(event);
        }
        if ((isWeekly && eventsToBeInserted.length === 12) || (!isWeekly && eventsToBeInserted.length === 1)) {
          createdEvent = queryRunner.manager.create(Event, eventsToBeInserted);
          if (isWeekly) {
            const weeklyEventGroup = new WeeklyEventGroup();
            weeklyEventGroup.startDate = eventsToBeInserted[0].startDate;
            weeklyEventGroup.endDate = eventsToBeInserted[11].endDate;
            weeklyEventGroup.status = eventsToBeInserted[0].status;
            queryRunner.manager.create(WeeklyEventGroup, new WeeklyEventGroup());
            const createdWeekly = await queryRunner.manager.save(weeklyEventGroup);
            for (const event of createdEvent) {
              event.weeklyGroupedId = createdWeekly.id;
            }
          }

          createdEvent = await queryRunner.manager.save(createdEvent);
        }
      }

      await queryRunner.commitTransaction();
      return createdEvent;
    } catch (error) {
      console.log({ error });
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  static insert = async (request: Request, response: Response) => {
    let {
      body: {
        startDate,
        endDate,
        notes,
        name,
        locationId,
        sport,
        status,
        isPublic,
        isTeam,
        playersAge,
        playersNumber,
        isWeekly,
        level,
        isUserReservation,
        organiserTeamId,
      },
    } = request;
    if (new Date(startDate) < new Date()) {
      throw new Error("Ora e eventit nuk mund te jete ne te shkuaren!");
    }

    const queryRunner = getManager().connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let createdEvent: any = false;
      let eventsToBeInserted = [];
      for (let i = 0; i <= (isWeekly ? 11 : 0); i++) {
        const incrementedStartDate = EventService.addDays(startDate, i);
        const incrementedEndDate = EventService.addDays(endDate, i);
        const overlappingEvent = await queryRunner.manager
          .createQueryBuilder()
          .from("events", "e")
          .where(`e.locationId = '${locationId}'`)
          .andWhere("e.status NOT IN (:...statuses)", {
            statuses: [EventStatus.DRAFT, EventStatus.CANCELED, EventStatus.REFUSED],
          })
          .andWhere(
            new Brackets((qb) => {
              qb.where(
                `(e.startDate < '${incrementedEndDate.toISOString()}' AND e.endDate > '${incrementedStartDate.toISOString()}')`
              );
              qb.orWhere(
                `(e.startDate = '${incrementedStartDate.toISOString()}' AND e.endDate = '${incrementedEndDate.toISOString()}')`
              );
            })
          )
          .andWhere("e.ts_deleted IS NULL")
          .setLock("pessimistic_read")
          .getRawOne();

        if (!overlappingEvent) {
          let minAge = 0;
          let maxAge = 0;
          if (playersAge) {
            const [minimumAge, maximumAge] = playersAge.split("-");
            minAge = minimumAge;
            maxAge = maximumAge;
          }
          const event = new CreateEventDto();
          event.startDate = incrementedStartDate;
          event.endDate = incrementedEndDate;
          event.isUserReservation = true;
          event.creatorId = response.locals.jwt.userId;
          event.notes = notes;
          event.name = name;
          event.locationId = locationId;
          event.sport = sport;
          event.status = status;
          event.isWeekly = isWeekly ? true : false;
          event.isUserReservation = isUserReservation;
          event.isPublic = isPublic;
          event.isTeam = isTeam;
          event.playersAge = playersAge;
          event.playersNumber = playersNumber;
          event.level = level;
          event.organiserTeamId = organiserTeamId ?? null;
          event.minAge = minAge;
          event.maxAge = maxAge;
          eventsToBeInserted.push(event);
        }
        if ((isWeekly && eventsToBeInserted.length === 12) || (!isWeekly && eventsToBeInserted.length === 1)) {
          createdEvent = queryRunner.manager.create(Event, eventsToBeInserted);

          const complexUser = await getRepository(User)
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.complex", "complex")
            .leftJoinAndSelect("complex.locations", "location")
            .where("location.id = :locationId", {
              locationId: createdEvent[0].locationId,
            })
            .getOne();

          await NotificationService.createEventNotification(
            complexUser.id,
            NotificationType.EVENT_CREATED,
            createdEvent[0].id,
            createdEvent[0].name,
            complexUser.pushToken,
            createdEvent[0].sport
          );
          if (isWeekly) {
            const weeklyEventGroup = new WeeklyEventGroup();
            weeklyEventGroup.startDate = eventsToBeInserted[0].startDate;
            weeklyEventGroup.endDate = eventsToBeInserted[11].endDate;
            weeklyEventGroup.status = eventsToBeInserted[0].status;
            queryRunner.manager.create(WeeklyEventGroup, new WeeklyEventGroup());
            const createdWeekly = await queryRunner.manager.save(weeklyEventGroup);
            for (const event of createdEvent) {
              event.weeklyGroupedId = createdWeekly.id;
            }
          }

          createdEvent = await queryRunner.manager.save(createdEvent);
        }
      }

      await queryRunner.commitTransaction();
      return createdEvent;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  };

  static createDummyTeams = async (events: Event[]) => {
    const teamRepository = getCustomRepository(TeamRepository);
    const eventRepository = getCustomRepository(EventRepository);
    const payload = [];
    for (const event of events) {
      const blueTeam = { name: "Ekipi blu", sport: event.sport, isDummy: true };
      const redTeam = { name: "Ekipi kuq", sport: event.sport, isDummy: true };
      payload.push(blueTeam);
      payload.push(redTeam);
    }

    const dummyTeams = await teamRepository.createQueryBuilder("team").insert().values(payload).execute();

    for (let j = 0; j < events.length; j++) {
      events[j].organiserTeamId = dummyTeams.generatedMaps[j * 2].id;
      events[j].receiverTeamId = dummyTeams.generatedMaps[j * 2 + 1].id;
    }
    eventRepository.save(events);
  };

  static createRequest = async (events: Event[]) => {
    const requestRepository = getCustomRepository(RequestRepository);
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);
    const payload = [];
    for (const event of events) {
      let element;
      if (event.isTeam) {
        element = {
          senderTeamId: event.organiserTeamId,
          receiverTeamId: event.organiserTeamId,
          eventId: event.id,
          sport: event.sport,
          status: RequestStatus.CONFIRMED,
        };
        const teamPlayers = await teamUsersRepository
          .createQueryBuilder("tu")
          .leftJoinAndSelect("tu.player", "player")
          .leftJoinAndSelect("tu.team", "team")
          .where("tu.status = :status", { status: RequestStatus.CONFIRMED })
          .andWhere("tu.teamId = :teamId", { teamId: event.organiserTeamId })
          .getMany();

        for (const teamPlayer of teamPlayers) {
          if (teamPlayer.playerId !== event.creatorId) {
            await NotificationService.createRequestNotification(
              teamPlayer.player.id,
              NotificationType.TEAM_CREATOR_CREATED_EVENT,
              event.id,
              event.name,
              teamPlayer.player.pushToken,
              event.sport,
              teamPlayer.team.name
            );
          }
        }
      } else {
        element = {
          senderId: event.creatorId,
          receiverId: event.creatorId,
          eventId: event.id,
          sport: event.sport,
          status: RequestStatus.CONFIRMED,
        };
      }
      payload.push(element);
    }
    await requestRepository.createQueryBuilder("request").insert().values(payload).execute();
  };

  static getById = async (eventId: number) => {
    const eventRepository = getCustomRepository(EventRepository);

    const event = await eventRepository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.location", "location")
      .leftJoinAndSelect("location.complex", "complex")
      .leftJoinAndSelect("event.organiserTeam", "organiserTeam")
      .leftJoinAndSelect("event.receiverTeam", "receiverTeam")
      .leftJoinAndSelect("organiserTeam.players", "organiserPlayers")
      .leftJoinAndSelect("receiverTeam.players", "receiverPlayers")
      .leftJoinAndSelect("organiserPlayers.player", "organiserPlayer")
      .leftJoinAndSelect("receiverPlayers.player", "receiverPlayer")
      .leftJoinAndSelect("event.eventRequests", "eventRequests", `eventRequests.status = 'confirmed'`)
      .leftJoinAndSelect("eventRequests.receiver", "eventPlayer")
      .where("event.id = :id", { id: eventId })
      .withDeleted()
      .getOne();

    return event.toResponseWithPlayers;
  };

  static findById = async (eventId: number, withDeleted: boolean) => {
    const eventRepository = getCustomRepository(EventRepository);

    const qb = eventRepository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.location", "location")
      .leftJoinAndSelect("location.complex", "complex")
      .where("event.id = :id", { id: eventId });

    if (withDeleted) {
      qb.withDeleted();
    }

    const event = await qb.getOne();

    return event;
  };

  static patch = async (eventPayload, currentEvent: Event, request: Request) => {
    const eventRepository = getCustomRepository(EventRepository);
    const eventWeeklyRepository = getCustomRepository(WeeklyEventGroupRepository);
    const {
      body: {
        startDate,
        endDate,
        notes,
        name,
        locationId,
        sport,
        status,
        isPublic,
        isTeam,
        playersAge,
        playersNumber,
        isWeekly,
        level,
      },
    } = request;
    if (new Date(startDate) < new Date()) {
      throw new Error("Ora e eventit nuk mund te jete  ne te shkuaren!");
    }

    let eventForConfirmation = false;
    let eventToBeCompleted = false;
    if (currentEvent.status === EventStatus.WAITING_FOR_CONFIRMATION) {
      eventForConfirmation = true;
    }
    if (currentEvent.status == EventStatus.CONFIRMED) {
      eventToBeCompleted = true;
    }

    const queryRunner = getManager().connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let updatedEvent: any = false;
      let eventsToBeUpdated = [];

      if (currentEvent.isWeekly) {
        const remainedEvents = await eventRepository
          .createQueryBuilder("e")
          .where("e.weeklyGroupedId = :groupedId", {
            groupedId: currentEvent.weeklyGroupedId,
          })
          .andWhere("e.startDate >= :now", { now: new Date().toISOString() })
          .getMany();

        if (startDate !== currentEvent.startDate.toISOString()) {
          for (const [i, event] of remainedEvents.entries()) {
            const incrementedStartDate = EventService.addDays(startDate, i);
            const incrementedEndDate = EventService.addDays(endDate, i);
            const overlappingEvent = await queryRunner.manager
              .createQueryBuilder()
              .from("events", "e")
              .where(`e.locationId = '${locationId}'`)
              .andWhere("e.status NOT IN (:...statuses)", {
                statuses: [EventStatus.DRAFT, EventStatus.CANCELED, EventStatus.REFUSED],
              })
              .andWhere(
                new Brackets((qb) => {
                  qb.where(
                    `(e.startDate < '${incrementedEndDate.toISOString()}' AND e.endDate > '${incrementedStartDate.toISOString()}')`
                  );
                  qb.orWhere(
                    `(e.startDate = '${incrementedStartDate.toISOString()}' AND e.endDate = '${incrementedEndDate.toISOString()}')`
                  );
                })
              )
              .andWhere("e.ts_deleted IS NULL")
              .setLock("pessimistic_read")
              .getRawOne();

            if (!overlappingEvent) {
              event.startDate = incrementedStartDate;
              event.endDate = incrementedEndDate;
              event.name = name;
              // event.notes = notes;
              // event.locationId = locationId;
              // event.sport = sport;
              // event.status = status;
              // event.isWeekly = isWeekly ? true : false;
              // event.isUserReservation = isUserReservation;
              // event.isPublic = isPublic;
              // event.isTeam = isTeam;
              // event.playersAge = playersAge;
              // event.playersNumber = playersNumber;
              // event.level = level;
              // event.organiserTeamId = organiserTeamId ?? null;
              // event.receiverTeamId = receiverTeamId ?? null;
              eventsToBeUpdated.push(event);
            }
          }
        } else {
          for (const event of remainedEvents) {
            event.name = name;
            // event.notes = notes;
            // event.locationId = locationId;
            // event.sport = sport;
            // event.status = status;
            // event.isWeekly = isWeekly ? true : false;
            // event.isPublic = isPublic;
            // event.isTeam = isTeam;
            // event.playersAge = playersAge;
            // event.playersNumber = playersNumber;
            // event.level = level;
            eventsToBeUpdated.push(event);
          }
        }

        updatedEvent = await queryRunner.manager.save(eventsToBeUpdated);

        // const weeklyEventGroup = await eventWeeklyRepository
        //   .createQueryBuilder()
        //   .where("id = :weeklyGroupId", { weeklyGroupId: currentEvent.weeklyGroupedId })
        //   .getOne();
        // weeklyEventGroup.startDate = eventsToBeUpdated[0].startDate;
        // weeklyEventGroup.endDate = eventsToBeUpdated[eventsToBeUpdated.length - 1].endDate;
        // queryRunner.manager.save(weeklyEventGroup);
      }

      await queryRunner.commitTransaction();
      return updatedEvent;
    } catch (error) {
      console.log(error);

      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    const mergedEvent = eventRepository.merge(currentEvent, eventPayload);
    const updatedEvent = await eventRepository.save(mergedEvent);

    // if (eventForConfirmation === true && updatedEvent.status === EventStatus.CONFIRMED) {
    //   const eventPlayers = await eventTeamsUsersRepository
    //     .createQueryBuilder("etu")
    //     .leftJoinAndSelect("etu.teamUser", "tu", "tu.id = etu.teamUserId")
    //     .leftJoinAndSelect("tu.player", "p", "p.id = tu.playerId")
    //     .where("etu.eventId = :eventId", { eventId: updatedEvent.id })
    //     .getMany();

    //   const mappedPlayersIds = eventPlayers.map((eventPlayers) => eventPlayers.teamUser.player.id);
    //   let notifications = [];
    //   for (const player of mappedPlayersIds) {
    //     const notificationBody = {
    //       receiverId: player,
    //       type: NotificationType.EVENT_CONFIRMED,
    //       payload: { eventId: updatedEvent.id, eventName: updatedEvent.name },
    //     };
    //     notifications.push(notificationBody);
    //   }
    //   await NotificationService.storeNotification(notifications);
    // }

    // if (eventToBeCompleted === true && updatedEvent.status === EventStatus.COMPLETED) {
    //   const eventPlayers = await eventTeamsUsersRepository
    //     .createQueryBuilder("etu")
    //     .leftJoinAndSelect("etu.teamUser", "tu", "tu.id = etu.teamUserId")
    //     .leftJoinAndSelect("tu.player", "p", "p.id = tu.playerId")
    //     .leftJoinAndSelect("tu.team", "t", "t.id = tu.teamId")
    //     .where("etu.eventId = :eventId", { eventId: updatedEvent.id })
    //     .getMany();

    //   const mappedPlayersIds = eventPlayers.map((eventPlayers) => {
    //     return {
    //       id: eventPlayers.teamUser.player.id,
    //       teamId: eventPlayers.teamUser.team.id,
    //     };
    //   });
    //   const organiserTeamPlayersIds = mappedPlayersIds
    //     .filter((teamPlayers) => teamPlayers.teamId === updatedEvent.organiserTeamId)
    //     .map((player) => player.id);
    //   const receiverTeamPlayersIds = mappedPlayersIds
    //     .filter((teamPlayers) => teamPlayers.teamId === updatedEvent.receiverTeamId)
    //     .map((player) => player.id);
    //   let notifications = [];
    //   for (const player of mappedPlayersIds) {
    //     const resultNotificationBody = {
    //       receiverId: player.id,
    //       type: NotificationType.EVENT_COMPLETED_RESULT,
    //       payload: { eventId: updatedEvent.id, eventName: updatedEvent.name },
    //     };
    //     const reviewNotificationBody = {
    //       receiverId: player.id,
    //       type: NotificationType.EVENT_COMPLETED_REVIEW,
    //       // TODO: Find opposite players
    //       payload: {
    //         eventId: updatedEvent.id,
    //         eventName: updatedEvent.name,
    //         oppositePlayersIds:
    //           player.teamId === updatedEvent.organiserTeamId ? receiverTeamPlayersIds : organiserTeamPlayersIds,
    //       },
    //     };
    //     notifications.push(resultNotificationBody);
    //     notifications.push(reviewNotificationBody);
    //   }

    //   await NotificationService.storeNotification(notifications);
    // }

    return updatedEvent;
  };

  static patchSingleEvent = async (eventPayload, currentEvent: Event, request: Request) => {
    const eventRepository = getCustomRepository(EventRepository);
    const requestRepository = getCustomRepository(RequestRepository);
    const userRepository = getCustomRepository(UserRepository);
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);
    const eventTeamUsersRepository = getCustomRepository(EventTeamUsersRepository);
    if (currentEvent.tsDeleted) {
      currentEvent.tsDeleted = null;
      await eventRepository.save(currentEvent);
    }
    let {
      body: {
        startDate,
        endDate,
        notes,
        name,
        locationId,
        sport,
        status,
        isPublic,
        isTeam,
        playersAge,
        playersNumber,
        isWeekly,
        organiserTeamCaptainId,
        receiverTeamCaptainId,
        isConfirmedByUser,
        level,
        lineups,
        isDraw,
        winnerTeamId,
        loserTeamId,
      },
    } = request;
    if (new Date(startDate) < new Date()) {
      throw new Error("Ora e eventit nuk mund te jete  ne te shkuaren!");
    }

    let eventToBeConfirmed = false;
    let eventToBeConfirmedByUser = false;
    let eventToBeCompleted = false;
    let pushNotificationToOrganiserTeamCaptain = false;
    let pushNotificationToReceiverTeamCaptain = false;
    if (currentEvent.status === EventStatus.WAITING_FOR_CONFIRMATION) {
      eventToBeConfirmed = true;
    }
    if (currentEvent.status === EventStatus.CONFIRMED && currentEvent.isConfirmedByUser == false) {
      eventToBeConfirmedByUser = true;
    }
    if (currentEvent.status == EventStatus.CONFIRMED && currentEvent.isConfirmedByUser == true) {
      eventToBeCompleted = true;
    }
    if (organiserTeamCaptainId && currentEvent.organiserTeamCaptainId !== organiserTeamCaptainId) {
      pushNotificationToOrganiserTeamCaptain = true;
    }
    if (receiverTeamCaptainId && currentEvent.receiverTeamCaptainId !== receiverTeamCaptainId) {
      pushNotificationToReceiverTeamCaptain = true;
    }

    const startDateToQuery = startDate ? startDate : currentEvent.startDate.toISOString();
    const endDateToQuery = endDate ? endDate : currentEvent.endDate.toISOString();
    locationId = locationId ? locationId : currentEvent.locationId;

    const queryRunner = getManager().connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let updatedEvent: any = false;
    try {
      let overlapping = false;
      if (
        (currentEvent.status === EventStatus.DRAFT && status === EventStatus.WAITING_FOR_CONFIRMATION) ||
        (startDate && startDate !== currentEvent.startDate && endDate && endDate !== currentEvent.endDate)
      ) {
        const overlappingEvent = await queryRunner.manager
          .createQueryBuilder()
          .from("events", "e")
          .where(`e.locationId = '${locationId}'`)
          .andWhere("e.status NOT IN (:...statuses)", {
            statuses: [EventStatus.DRAFT, EventStatus.CANCELED, EventStatus.REFUSED],
          })
          .andWhere("e.id != :eventId", { eventId: request.params.eventId })
          .andWhere(
            new Brackets((qb) => {
              qb.where(`(e.startDate < '${endDateToQuery}' AND e.endDate > '${startDateToQuery}')`);
              qb.orWhere(`(e.startDate = '${startDateToQuery}' AND e.endDate = '${endDateToQuery}')`);
            })
          )
          .andWhere("e.ts_deleted IS NULL")
          .setLock("pessimistic_read")
          .getRawOne();
        if (overlappingEvent) {
          overlapping = true;
        }
      }

      if (overlapping) {
        throw new Error();
      } else {
        if (playersAge && playersAge !== currentEvent.playersAge) {
          const [minimumAge, maximumAge] = playersAge.split("-");
          eventPayload.minAge = minimumAge;
          eventPayload.maxAge = maximumAge;
        }
        const mergedEvent = queryRunner.manager.merge(Event, currentEvent, eventPayload);
        updatedEvent = await queryRunner.manager.save(mergedEvent);
        await queryRunner.commitTransaction();

        if (pushNotificationToOrganiserTeamCaptain) {
          const organiserTeamCaptain = await userRepository
            .createQueryBuilder("u")
            .where("u.id = :id", { id: updatedEvent.organiserTeamCaptainId })
            .getOne();

          NotificationService.createRequestNotification(
            updatedEvent.organiserTeamCaptainId,
            NotificationType.ORGANISER_TEAM_CAPTAION,
            currentEvent.id,
            currentEvent.name,
            organiserTeamCaptain.pushToken,
            currentEvent.sport
          );
        }

        if (pushNotificationToReceiverTeamCaptain) {
          const receiverTeamCaptain = await userRepository
            .createQueryBuilder("u")
            .where("u.id = :id", { id: updatedEvent.receiverTeamCaptainId })
            .getOne();

          NotificationService.createRequestNotification(
            updatedEvent.receiverTeamCaptainId,
            NotificationType.RECEIVER_TEAM_CAPTAION,
            currentEvent.id,
            currentEvent.name,
            receiverTeamCaptain.pushToken,
            currentEvent.sport
          );
        }

        if (eventToBeConfirmed === true && updatedEvent.status === EventStatus.CONFIRMED) {
          if (currentEvent.isTeam) {
            const teams = await requestRepository
              .createQueryBuilder("r")
              .where("r.eventId = :eventId", { eventId: currentEvent.id })
              .andWhere("r.status = :status", {
                status: RequestStatus.CONFIRMED,
              })
              .getOne();

            const eventPlayers = await teamUsersRepository
              .createQueryBuilder("tu")
              .leftJoinAndSelect("tu.player", "player")
              .where("tu.teamId IN (:...teamId)", {
                teamId: [teams.senderTeamId, teams.receiverTeamId],
              })
              .andWhere("tu.isConfirmed = :boolean", { boolean: true })
              .andWhere("tu.status = :status", {
                status: RequestStatus.CONFIRMED,
              })
              .getMany();

            const mappedPlayers = eventPlayers.map((player) => player.player);
            for (const player of mappedPlayers) {
              NotificationService.createRequestNotification(
                player.id,
                NotificationType.EVENT_CONFIRMED,
                currentEvent.id,
                currentEvent.name,
                player.pushToken,
                currentEvent.sport
              );
            }
          } else {
            const eventPlayers = await requestRepository
              .createQueryBuilder("r")
              .leftJoinAndSelect("r.receiver", "receiver")
              .where("r.eventId = :eventId", { eventId: currentEvent.id })
              .andWhere("r.status = :status", {
                status: RequestStatus.CONFIRMED,
              })
              .getMany();

            const mappedPlayers = eventPlayers.map((eventPlayer) => eventPlayer.receiver);
            for (const player of mappedPlayers) {
              NotificationService.createRequestNotification(
                player.id,
                NotificationType.EVENT_CONFIRMED,
                currentEvent.id,
                currentEvent.name,
                player.pushToken,
                currentEvent.sport
              );
            }
          }
        }

        if (eventToBeConfirmedByUser === true && updatedEvent.isConfirmedByUser == true) {
          const complexAdmins = await userRepository
            .createQueryBuilder("u")
            .where("u.complexId = :id", { id: currentEvent.location.complexId })
            .getMany();

          const eventCreator = await userRepository
            .createQueryBuilder("u")
            .where("u.id = :creatorId", { creatorId: currentEvent.creatorId })
            .getOne();

          const eventPlayers = await requestRepository
            .createQueryBuilder("r")
            .leftJoinAndSelect("r.receiver", "receiver")
            .where("r.eventId = :eventId", { eventId: currentEvent.id })
            .andWhere("r.status = :status", { status: RequestStatus.CONFIRMED })
            .getMany();

          const mappedPlayers = eventPlayers.map((eventPlayer) => eventPlayer.receiver);
          for (const player of mappedPlayers) {
            if (player.id !== eventCreator.id) {
              NotificationService.createRequestNotification(
                player.id,
                NotificationType.EVENT_CONFIRMED_BY_USER,
                currentEvent.id,
                currentEvent.name,
                player.pushToken,
                currentEvent.sport,
                eventCreator.name
              );
            }
          }

          for (const admin of complexAdmins) {
            if (admin.pushToken) {
              NotificationService.createRequestNotification(
                admin.id,
                NotificationType.EVENT_CONFIRMED_BY_USER,
                currentEvent.id,
                currentEvent.name,
                admin.pushToken,
                currentEvent.sport,
                eventCreator.name
              );
            }
          }
        }

        if (eventToBeCompleted === true && updatedEvent.status === EventStatus.COMPLETED) {
          if (currentEvent.isTeam) {
            const teamsIds = [currentEvent.organiserTeamId, currentEvent.receiverTeamId];
            const organiserPlayersIds = [];
            const receiverPlayersIds = [];
            const organiserTeamFormation = updatedEvent.lineups.organiserTeam.playersFormation;
            const receiverTeamFormation = updatedEvent.lineups.receiverTeam.playersFormation;
            for (const organiserPlayer in organiserTeamFormation) {
              organiserPlayersIds.push(organiserTeamFormation[organiserPlayer].id);
            }
            for (const receiverPlayer in receiverTeamFormation) {
              receiverPlayersIds.push(receiverTeamFormation[receiverPlayer].id);
            }

            const organiserTeamUsers = await teamUsersRepository
              .createQueryBuilder("tu")
              .where("tu.teamId = :teamId", { teamId: currentEvent.organiserTeamId })
              .andWhere("tu.playerId IN (:...organiserPlayersIds)", { organiserPlayersIds })
              .andWhere("tu.status = :status", { status: RequestStatus.CONFIRMED })
              .getMany();
            const receiverTeamUsers = await teamUsersRepository
              .createQueryBuilder("tu")
              .where("tu.teamId = :teamId", { teamId: currentEvent.receiverTeamId })
              .andWhere("tu.playerId IN (:...receiverPlayersIds)", { receiverPlayersIds })
              .andWhere("tu.status = :status", { status: RequestStatus.CONFIRMED })
              .getMany();

            const teamUsers = [...organiserTeamUsers, ...receiverTeamUsers];

            const eventTeamUsersPayload = [];
            for (const tu of teamUsers) {
              const eventTeamUserBody = [tu.id, updatedEvent.id];
              eventTeamUsersPayload.push(eventTeamUserBody);
            }

            await eventTeamUsersRepository
              .createQueryBuilder()
              .insert()
              .into(EventTeamUsers)
              .values(
                eventTeamUsersPayload.map((item) => {
                  return {
                    teamUserId: item[0],
                    eventId: item[1],
                  };
                })
              )
              .execute();
          } else {
            const teamUsersPayload = [];
            const organiserTeamFormation = updatedEvent.lineups.organiserTeam.playersFormation;
            const receiverTeamFormation = updatedEvent.lineups.receiverTeam.playersFormation;
            for (const organiserPlayer in organiserTeamFormation) {
              const playerId = organiserTeamFormation[organiserPlayer].id;
              const teamId = updatedEvent.organiserTeamId;
              const sport = updatedEvent.sport;
              const teamUserBody = [playerId, teamId, RequestStatus.CONFIRMED, sport];
              teamUsersPayload.push(teamUserBody);
            }
            for (const receiverPlayer in receiverTeamFormation) {
              const playerId = receiverTeamFormation[receiverPlayer].id;
              const teamId = updatedEvent.receiverTeamId;
              const sport = updatedEvent.sport;
              const teamUserBody = [playerId, teamId, RequestStatus.CONFIRMED, sport];
              teamUsersPayload.push(teamUserBody);
            }

            const teamUsers = await teamUsersRepository
              .createQueryBuilder()
              .insert()
              .into(TeamUsers)
              .values(
                teamUsersPayload.map((item) => {
                  return {
                    playerId: item[0],
                    teamId: item[1],
                    status: item[2],
                    sport: item[3],
                  };
                })
              )
              .execute();

            const eventTeamUsersPayload = [];
            for (const tu of teamUsers.generatedMaps) {
              const eventTeamUserBody = [tu.id, updatedEvent.id];
              eventTeamUsersPayload.push(eventTeamUserBody);
            }

            await eventTeamUsersRepository
              .createQueryBuilder()
              .insert()
              .into(EventTeamUsers)
              .values(
                eventTeamUsersPayload.map((item) => {
                  return {
                    teamUserId: item[0],
                    eventId: item[1],
                  };
                })
              )
              .execute();
          }

          // const eventPlayers = await eventTeamsUsersRepository
          //   .createQueryBuilder("etu")
          //   .leftJoinAndSelect("etu.teamUser", "tu", "tu.id = etu.teamUserId")
          //   .leftJoinAndSelect("tu.player", "p", "p.id = tu.playerId")
          //   .leftJoinAndSelect("tu.team", "t", "t.id = tu.teamId")
          //   .where("etu.eventId = :eventId", { eventId: updatedEvent.id })
          //   .getMany();
          // const mappedPlayersIds = eventPlayers.map((eventPlayers) => {
          //   return {
          //     id: eventPlayers.teamUser.player.id,
          //     teamId: eventPlayers.teamUser.team.id,
          //   };
          // });
          // const organiserTeamPlayersIds = mappedPlayersIds
          //   .filter((teamPlayers) => teamPlayers.teamId === updatedEvent.organiserTeamId)
          //   .map((player) => player.id);
          // const receiverTeamPlayersIds = mappedPlayersIds
          //   .filter((teamPlayers) => teamPlayers.teamId === updatedEvent.receiverTeamId)
          //   .map((player) => player.id);
          // let notifications = [];
          // for (const player of mappedPlayersIds) {
          //   const resultNotificationBody = {
          //     receiverId: player.id,
          //     type: NotificationType.EVENT_COMPLETED_RESULT,
          //     payload: { eventId: updatedEvent.id, eventName: updatedEvent.name },
          //   };
          //   const reviewNotificationBody = {
          //     receiverId: player.id,
          //     type: NotificationType.EVENT_COMPLETED_REVIEW,
          //     // TODO: Find opposite players
          //     payload: {
          //       eventId: updatedEvent.id,
          //       eventName: updatedEvent.name,
          //       oppositePlayersIds:
          //         player.teamId === updatedEvent.organiserTeamId ? receiverTeamPlayersIds : organiserTeamPlayersIds,
          //     },
          //   };
          //   notifications.push(resultNotificationBody);
          //   notifications.push(reviewNotificationBody);
          // }
          // await NotificationService.storeNotification(notifications);
        }

        return updatedEvent;
      }
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      return "Ky orar eshte i zene";
    } finally {
      await queryRunner.release();
    }
  };

  static addDays = (date, counter) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + counter * 7);
    newDate.setHours(newDate.getHours());
    newDate.setMinutes(newDate.getMinutes());
    return new Date(newDate.setSeconds(0));
  };
}
