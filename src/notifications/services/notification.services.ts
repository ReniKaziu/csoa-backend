import Axios from "axios";
import { Request, Response } from "express";
import { Brackets, getCustomRepository, getRepository } from "typeorm";
import { Event } from "../../event/entities/event.entity";
import { Request as Invitation, RequestStatus } from "../../request/entities/request.entity";
import { Team } from "../../team/entities/team.entity";
import { TeamUsers } from "../../team/entities/team.users.entity";
import { User } from "../../user/entities/user.entity";
import { Notification, NotificationType } from "../entities/notification.entity";
import { NotificationRepository } from "../repositories/notification.repository";

export class NotificationService {
  static listMyNotifications = async (request: Request, response: Response) => {
    const notificationRepository = getCustomRepository(NotificationRepository);
    const userId = response.locals.jwt.userId;

    const queryBuilder = notificationRepository
      .createQueryBuilder("notification")
      .where("notification.receiverId = :userId", { userId })
      .orWhere("notification.senderId = :userId", { userId });

    if (request.query.chats === "true") {
      queryBuilder.andWhere("notification.type IN (:...types)", {
        types: [NotificationType.CHAT_EVENT, NotificationType.CHAT_TEAM, NotificationType.CHAT_USER],
      });
    } else {
      queryBuilder.andWhere("notification.type NOT IN (:...types)", {
        types: [NotificationType.CHAT_EVENT, NotificationType.CHAT_TEAM, NotificationType.CHAT_USER],
      });
    }
    queryBuilder.addOrderBy("notification.id", "DESC");

    const myNotifications = await queryBuilder.getMany();

    return myNotifications.map((n) => n.toResponse);
  };

  static listMyComplexNotifications = async (request: Request, response: Response) => {
    const notificationRepository = getCustomRepository(NotificationRepository);
    const eventId = request.params.complexId;

    const myNotifications = await notificationRepository
      .createQueryBuilder("notification")
      .where("complexId = :eventId", { eventId })
      .getMany();

    return myNotifications;
  };

  static findById = async (id: number) => {
    const notificationRepository = getCustomRepository(NotificationRepository);

    const notification = await notificationRepository
      .createQueryBuilder("notification")
      .where("notification.id = :id", { id })
      .getOne();

    return notification;
  };

  static updateNotification = async (notification: Notification) => {
    const notificationRepository = getRepository(Notification);

    try {
      await notificationRepository
        .createQueryBuilder()
        .from(Notification, "n")
        .update()
        .set({ isRead: true })
        .where("notifications.id = :id", { id: notification.id })
        .execute();

      return "Njoftimi u perditesua";
    } catch (err) {
      console.log(err);
    }
  };

  static updateChatNotification = async (notification: Notification, body: any) => {
    const notificationRepository = getRepository(Notification);

    try {
      await notificationRepository.update({ id: notification.id }, { readIds: JSON.stringify(body.readIds) });

      return "Njoftimi chat u perditesua";
    } catch (err) {
      console.log(err);
    }
  };

  static pushChatNotification = async (request: Request, response: Response) => {
    try {
      const userRepository = getRepository(User);
      const body = request.body;
      if (body.type === NotificationType.CHAT_USER) {
        const receiverId = body.payload.userId;
        const senderId = response.locals.jwt.userId;
        const sentIds = [];
        const readIds = [];
        sentIds.push(senderId, +receiverId);
        readIds.push(senderId);
        const receiverUser = await userRepository
          .createQueryBuilder("user")
          .where("user.id = :receiverId", { receiverId })
          .getOne();
        const senderUser = await userRepository
          .createQueryBuilder("user")
          .where("user.id = :senderId", { senderId })
          .getOne();
        const notificationBody = {
          receiverId: receiverUser.id,
          senderId: senderUser.id,
          type: NotificationType.CHAT_USER,
          sentIds: JSON.stringify(sentIds),
          readIds: JSON.stringify(readIds),
          payload: {
            receiverPhoto: receiverUser.profilePicture,
            receiverName: receiverUser.name,
            senderPhoto: senderUser.profilePicture,
            senderName: senderUser.name,
            exponentPushToken: receiverUser.pushToken ?? "123",
            title: `Mesazh i ri nga ${senderUser.name}`,
            body: body.payload.message,
          },
        };

        const roomId = receiverId > senderId ? `${senderId}${receiverId}` : `${receiverId}${senderId}`;
        const insideUserChatJson = JSON.stringify({ userId: Number(roomId) });
        if (JSON.stringify(receiverUser.roomId) !== insideUserChatJson) {
          const pushNotifications = [];
          const pushNotificationBody = {
            to: receiverUser.pushToken ?? "123",
            title: `Mesazh i ri nga ${senderUser.name}`,
            body: body.payload.message,
            data: {
              receiverId: receiverUser.id,
              receiverPhoto: receiverUser.profilePicture,
              receiverName: receiverUser.name,
              senderPhoto: senderUser.profilePicture,
              senderName: senderUser.name,
            },
          };
          pushNotifications.push(pushNotificationBody);
          NotificationService.pushNotification(pushNotifications);
        }
        const notifications = [];
        notifications.push(notificationBody);
        NotificationService.storeNotification(notifications);
      }

      if (body.type === NotificationType.CHAT_TEAM) {
        const senderId = response.locals.jwt.userId;
        const teamUsersRepository = getRepository(TeamUsers);
        const teamRepository = getRepository(Team);
        const team = await teamRepository
          .createQueryBuilder("t")
          .where("t.id = :id", { id: body.payload.teamId })
          .getOne();
        const teamPhoto = team?.avatar ? team?.avatar?.split("/").pop() : "";
        const teamPlayers = await teamUsersRepository
          .createQueryBuilder("teamUser")
          .leftJoinAndSelect("teamUser.player", "user")
          .where("teamUser.teamId = :teamId", { teamId: body.payload.teamId })
          .andWhere("teamUser.status = :status", { status: RequestStatus.CONFIRMED })
          // .andWhere("teamUser.playerId != :playerId", { playerId: senderId })
          .getMany();

        const senderName = await userRepository
          .createQueryBuilder("user")
          .select("user.name")
          .where("user.id = :senderId", { senderId })
          .getOne();
        const sentIds = [];
        const notifications = [];
        const notificationBody = {
          senderId: senderId,
          teamId: body.payload.teamId,
          type: NotificationType.CHAT_TEAM,
          sentIds: JSON.stringify(sentIds),
          readIds: JSON.stringify([senderId]),
          payload: {
            teamId: body.payload.teamId,
            teamName: team.name,
            teamPhoto,
            title: `Mesazh i ri nga ${senderName.name}`,
            body: body.payload.message,
          },
        };
        const pushNotifications = [];
        for (const teamPlayer of teamPlayers) {
          const insideTeamChatJson = JSON.stringify({ teamId: team.id });
          if (JSON.stringify(teamPlayer.player.roomId) !== insideTeamChatJson) {
            if (team) sentIds.push(teamPlayer.playerId);
            if (teamPlayer.playerId !== senderId) {
              const pushNotificationBody = {
                to: teamPlayer.player.pushToken ?? "123",
                title: `Mesazh i ri nga ${senderName.name}`,
                body: body.payload.message,
                data: { teamId: body.payload.teamId, teamName: team.name, teamPhoto },
              };
              pushNotifications.push(pushNotificationBody);
            }
            NotificationService.pushNotification(pushNotifications);
          }
        }
        notifications.push(notificationBody);
        NotificationService.storeNotification(notifications);
      }

      if (body.type === NotificationType.CHAT_EVENT) {
        const requestsRepository = getRepository(Invitation);
        const eventsRepository = getRepository(Event);
        const senderId = response.locals.jwt.userId;
        const event = await eventsRepository
          .createQueryBuilder("e")
          .where("e.id = :eventId", { eventId: body.payload.eventId })
          .getOne();

        const eventPlayers = await requestsRepository
          .createQueryBuilder("request")
          .leftJoinAndSelect("request.receiver", "user")
          .where("request.eventId = :eventId", { eventId: body.payload.eventId })
          .andWhere("request.status = :status", { status: RequestStatus.CONFIRMED })
          .getMany();
        const senderName = await userRepository
          .createQueryBuilder("user")
          .select("user.name")
          .where("user.id = :senderId", { senderId })
          .getOne();
        const sentIds = [];
        const notifications = [];
        const notificationBody = {
          senderId: senderId,
          eventId: body.payload.eventId,
          sentIds: JSON.stringify(sentIds),
          readIds: JSON.stringify([senderId]),
          type: NotificationType.CHAT_EVENT,
          payload: {
            eventId: body.payload.eventId,
            eventName: event.name,
            eventStartDate: event.startDate,
            eventEndDate: event.endDate,
            title: `Mesazh i ri nga ${senderName.name}`,
            body: body.payload.message,
          },
        };

        const pushNotifications = [];
        for (const eventPlayer of eventPlayers) {
          const insideEventChatJson = JSON.stringify({ eventId: event.id });
          if (JSON.stringify(eventPlayer.receiver.roomId) !== insideEventChatJson) {
            sentIds.push(eventPlayer.receiverId);
            if (eventPlayer.receiverId !== senderId) {
              const pushNotificationBody = {
                to: eventPlayer.receiver.pushToken ?? "123",
                title: `Mesazh i ri nga ${senderName.name}`,
                body: body.payload.message,
                data: {
                  eventId: body.payload.eventId,
                  eventName: event.name,
                  eventStartDate: event.startDate,
                  eventEndDate: event.endDate,
                },
              };
              pushNotifications.push(pushNotificationBody);
            }
            NotificationService.pushNotification(pushNotifications);
          }
        }
        notifications.push(notificationBody);
        NotificationService.storeNotification(notifications);
      }
      return "Success";
    } catch (err) {
      console.log(err);
    }
  };

  static storeNotification = async (payload) => {
    const notificationRepository = getCustomRepository(NotificationRepository);
    if (payload[0]?.type === NotificationType.CHAT_USER) {
      const senderId = payload[0].senderId;
      const receiverId = payload[0].receiverId;
      const foundMessage = await notificationRepository
        .createQueryBuilder("n")
        .where(
          new Brackets((qb) =>
            qb.where("n.senderId = :senderId", { senderId }).andWhere("n.receiverId = :receiverId", { receiverId })
          )
        )
        .orWhere(
          new Brackets((qb) => {
            qb.where("n.senderId = :receiverId", { receiverId }).andWhere("n.receiverId = :senderId", { senderId });
          })
        )
        .getOne();
      if (foundMessage) {
        await notificationRepository
          .createQueryBuilder("n")
          .update(foundMessage as any, payload[0])
          .execute();
        return "Notification successfully updated";
      }
    }
    if (payload[0]?.type === NotificationType.CHAT_TEAM) {
      const foundTeamMessage = await notificationRepository
        .createQueryBuilder("n")
        .where("n.teamId = :teamId", { teamId: payload[0].payload.teamId })
        .getOne();
      if (foundTeamMessage) {
        await notificationRepository
          .createQueryBuilder("n")
          .update(foundTeamMessage as any, payload[0])
          .execute();
        return "Notification succesfully updated";
      }
    }
    if (payload[0]?.type === NotificationType.CHAT_EVENT) {
      const foundEventMessage = await notificationRepository
        .createQueryBuilder("n")
        .where("n.eventId = :eventId", { eventId: payload[0].payload.eventId })
        .getOne();
      if (foundEventMessage) {
        await notificationRepository
          .createQueryBuilder("n")
          .update(foundEventMessage as any, payload[0])
          .execute();
        return "Notification succesfully updated";
      }
    }
    await notificationRepository.createQueryBuilder("notification").insert().values(payload).execute();
    return "Notification successfully created!";
  };

  static pushNotification = async (payload) => {
    const PUSH_TOKEN_BASE_API = "https://exp.host/--/api/v2/push/send";
    const headers = {
      host: "exp.host",
      accept: "application/json",
      "accept-encoding": "gzip, deflate",
      "content-type": "application/json",
    };

    for (const body of payload) {
      const response = await Axios.post(PUSH_TOKEN_BASE_API, body, { headers });
    }
  };

  static createTeamUserNotification = async (
    receiverId: number,
    notificationType: NotificationType,
    teamName: string,
    teamId: number,
    userToken: string,
    sport: string,
    senderName?: string
  ) => {
    let notifications = [];
    let pushNotifications = [];

    const titles = {
      [NotificationType.INVITATION_TO_TEAM]: `${senderName} ju fton tek ekipi: ${teamName} per ${sport}`,
      [NotificationType.INVITATION_TO_TEAM_CONFIRMED]: `Lojtari ${senderName} pranoi ftesen tek ekipi: ${teamName} per ${sport}`,
      [NotificationType.INVITATION_TO_TEAM_REFUSED]: `Lojtari ${senderName} refuzoi ftesen tek ekipi: ${teamName} per ${sport}`,
      [NotificationType.USER_EXITED_TEAM]: `Lojtari ${senderName} eshte larguar nga ekipi: ${teamName}`,
      [NotificationType.USER_EXCLUDED_FROM_TEAM]: `Krijuesi ${senderName} ju largoi nga ekipi: ${teamName}`,
    };

    const notificationBody = {
      receiverId,
      type: notificationType,
      payload: {
        teamName: teamName,
        teamId: teamId,
        exponentPushToken: userToken,
        title: titles[notificationType],
        body: "Futuni ne aplikacion dhe shikoni me shume",
      },
    };
    const pushNotificationBody = {
      to: userToken ?? "123",
      title: titles[notificationType],
      body: "Futuni ne aplikacion dhe shikoni me shume",
      data: { teamId },
    };

    notifications.push(notificationBody);
    pushNotifications.push(pushNotificationBody);
    NotificationService.storeNotification(notifications);
    NotificationService.pushNotification(pushNotifications);
  };

  static createRequestNotification = async (
    receiverId: number,
    notificationType: NotificationType,
    eventId: number,
    eventName: string,
    userToken: string,
    sport?: string,
    senderName?: string
  ) => {
    let notifications = [];
    let pushNotifications = [];
    const sportsMapped = {
      football: "futboll",
      basketball: "basketboll",
      tenis: "tenis",
      voleyball: "volejboll",
    };

    const titles = {
      [NotificationType.INVITATION_TO_EVENT]: `${senderName} te fton per ${sportsMapped[sport]} ne eventin ${eventName}`,
      [NotificationType.REQUEST_TO_EVENT]: `${senderName} deshiron te bashkohet ne eventin ${eventName} tuaj per ${sportsMapped[sport]} `,
      [NotificationType.TEAM_REQUEST_TO_EVENT]: `Ekipi ${senderName} ka kerkuar te futet ne eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.INVITATION_DELETED]: `Ftesa per lojen ${sportsMapped[sport]} eshte anuluar!`,
      [NotificationType.CREATOR_CONFIRMED_REQUEST]: `${senderName} pranoi kerkesen tuaj per t'u futur ne eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.USER_CONFIRMED_INVITATION]: `${senderName} pranoi ftesen per ${sportsMapped[sport]} tek eventi ${eventName}`,
      [NotificationType.CREATOR_REFUSED_REQUEST]: `Na vjen keq por eshte plotesuar numri i lojtareve`,
      [NotificationType.USER_REFUSED_REQUEST]: `${senderName} refuzoi ftesen tek eventi ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.TEAM_INVITED_TO_EVENT]: `${senderName} ju ftoi te luani tek eventi ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.EVENT_CONFIRMED]: `Eventi ${eventName} per ${sportsMapped[sport]} u konfirmua nga kompleksi`,
      [NotificationType.EVENT_CONFIRMED_BY_USER]: `Perdoruesi ${senderName} konfirmoi eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.TEAM_REQUEST_TO_EVENT_CONFIRMED]: `Kerkesa ne ekip per tu futur tek eventi ${eventName} per ${sportsMapped[sport]} u konfirmua`,
      [NotificationType.TEAM_CONFIRMED_INVITATION]: `Ekipi ${senderName} pranoi ftesen ne eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.TEAM_REQUEST_TO_EVENT_REFUSED]: `Na vjen keq por eshte plotesuar numri i ekipeve`,
      [NotificationType.TEAM_REFUSED_INVITATION]: `Ekipi ${senderName} refuzoi ftesen ne eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.ORGANISER_TEAM_CAPTAION]: `Ju jeni zgjedhur kapiten ne eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.RECEIVER_TEAM_CAPTAION]: `Ju jeni zgjedhur kapiten ne eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.TEAM_CREATOR_CREATED_EVENT]: `Krijuesi i skuadres ${senderName} krijoi eventin ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.TEAM_EXCLUDED_FROM_EVENT]: `Krijuesi i eventit ${senderName} largoi skuadren tuaj nga eventi ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.TEAM_LEFT_EVENT]: `Skuadra ${senderName} u larguar nga eventi ${eventName} per ${sportsMapped[sport]}`,
      [NotificationType.USER_LEFT_EVENT]: `Lojtari ${senderName} u larguar nga eventi ${eventName} per ${sportsMapped[sport]}`,
    };

    const notificationBody = {
      receiverId: receiverId,
      type: notificationType,
      payload: {
        eventId: eventId,
        eventName: eventName,
        exponentPushToken: userToken,
        title: titles[notificationType],
        body: "Futuni ne aplikacion dhe shikoni me shume",
      },
    };

    const pushNotificationBody = {
      to: userToken ?? "123",
      title: titles[notificationType],
      body: "Futuni ne aplikacion dhe shikoni me shume",
      data: { eventId },
    };

    notifications.push(notificationBody);
    pushNotifications.push(pushNotificationBody);
    NotificationService.storeNotification(notifications);
    NotificationService.pushNotification(pushNotifications);
  };

  static createEventNotification = async (
    receiverId: number,
    notificationType: NotificationType,
    eventId: number,
    eventName: string,
    userToken: string,
    sport?: string
  ) => {
    let notifications = [];
    let pushNotifications = [];
    const sportsMapped = {
      football: "futboll",
      basketball: "basketboll",
      tenis: "tenis",
      voleyball: "volejboll",
    };

    const titles = {
      [NotificationType.EVENT_CREATED]: `Nje event i ri per ${sportsMapped[sport]} eshte krijuar ne kompleks`,
      [NotificationType.EVENT_DELETED_BY_USER_BEFORE_CONFIRMATION]: `Eventi ${eventName} per ${sportsMapped[sport]} u kancelua nga perdoruesi para konfirmimit`,
      [NotificationType.EVENT_REFUSED_BY_COMPLEX]: `Eventi ${eventName} per ${sportsMapped[sport]} u refuzua nga kompleksi`,
      [NotificationType.EVENT_CANCELED_BY_USER_AFTER_CONFIRMATION]: `Eventi i konfirmuar ${eventName} per ${sportsMapped[sport]} u kancelua nga perdoruesi`,
      [NotificationType.EVENT_CANCELED_BY_COMPLEX_AFTER_CONFIRMATION]: `Eventi i konfirmuar ${eventName} per ${sportsMapped[sport]} u kancelua nga kompleksi`,
      [NotificationType.EVENT_CONFIRMED]: `Eventi ${eventName} per ${sportsMapped[sport]} u konfirmua nga kompleksi`,
    };

    const notificationBody = {
      receiverId: receiverId,
      type: notificationType,
      payload: {
        eventId: eventId,
        eventName: eventName,
        exponentPushToken: userToken,
        title: titles[notificationType],
        body: "Futuni ne aplikacion dhe shikoni me shume",
      },
    };
    const pushNotificationBody = {
      to: userToken ?? "123",
      title: titles[notificationType],
      body: "Futuni ne aplikacion dhe shikoni me shume",
      data: { eventId },
    };

    notifications.push(notificationBody);
    pushNotifications.push(pushNotificationBody);
    NotificationService.storeNotification(notifications);
    NotificationService.pushNotification(pushNotifications);
  };
}
