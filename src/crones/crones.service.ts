import { getRepository } from "typeorm";
import { Event } from "../event/entities/event.entity";
import { Notification } from "../notifications/entities/notification.entity";
import { Request } from "../request/entities/request.entity";
import { TeamUsers } from "../team/entities/team.users.entity";
const axios = require("axios").default;

function getCurrentDateTime() {
  const date = new Date();
  const now_utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
  return new Date(now_utc);
}

export const checkForCompletedEvents = async () => {
  const notifications = [];
  const pushNotifications = [];
  const dateNow = getCurrentDateTime();
  const eventsRepository = getRepository(Event);
  const notificationsRepository = getRepository(Notification);
  eventsRepository.createQueryBuilder("e").select("e.id as eventId");
  const selectEventsQuery = `SELECT 
                              event.id as eventId, 
                              event.name as eventName, 
                              organiserTeamCaptain.id as organiserTeamCaptainId, 
                              organiserTeamCaptain.pushToken as organiserPushToken, 
                              receiverTeamCaptain.id as receiverTeamCaptainId, 
                              receiverTeamCaptain.pushToken as receiverPushToken
                              FROM events event
                                LEFT JOIN users organiserTeamCaptain ON organiserTeamCaptain.id=event.organiserTeamCaptainId AND (organiserTeamCaptain.ts_deleted IS NULL) 
                                LEFT JOIN users receiverTeamCaptain ON receiverTeamCaptain.id=event.receiverTeamCaptainId AND (receiverTeamCaptain.ts_deleted IS NULL) 
                                  WHERE status = 'confirmed' AND result IS NULL AND event.ts_deleted IS NULL AND completedCronSent = 0 AND endDate < '${dateNow.toISOString()}'`;

  // 1- Select events to be updated query
  const selectedEvents = await eventsRepository.manager.query(selectEventsQuery);
  if (selectedEvents.length) {
    const ids = [];
    for (const result of selectedEvents) {
      ids.push(result.eventId);
      const organiserCaptainSetResultNotificationBody = [
        JSON.stringify({
          setResult: true,
          eventId: result.eventId,
          eventName: result.eventName,
          exponentPushToken: result.organiserPushToken ?? "123",
          title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
          body: "Futuni ne aplikacion dhe vendosni rezultatin",
        }),
        "cron update result notification",
        result.organiserTeamCaptainId,
      ];
      const organiserCaptainSetReviewNotificationBody = [
        JSON.stringify({
          setReview: true,
          eventId: result.eventId,
          eventName: result.eventName,
          exponentPushToken: result.organiserPushToken ?? "123",
          title: `Eventi: ${result.eventName} ka perfunduar. Mund te beni vleresimet per lojtaret e ndeshjes`,
          body: "Futuni ne aplikacion dhe vleresoni lojtaret",
        }),
        "cron set review notification",
        result.organiserTeamCaptainId,
      ];
      const receiverCaptainSetResultNotificationBody = [
        JSON.stringify({
          setResult: true,
          eventId: result.eventId,
          eventName: result.eventName,
          exponentPushToken: result.receiverPushToken ?? "123",
          title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
          body: "Futuni ne aplikacion dhe vendosni rezultatin",
        }),
        "cron update result notification",
        result.receiverTeamCaptainId,
      ];
      const receiverCaptainSetReviewNotificationBody = [
        JSON.stringify({
          setReview: true,
          eventId: result.eventId,
          eventName: result.eventName,
          exponentPushToken: result.receiverPushToken ?? "123",
          title: `Eventi: ${result.eventName} ka perfunduar. Mund te beni vleresimet per lojtaret e ndeshjes`,
          body: "Futuni ne aplikacion dhe vleresoni lojtaret",
        }),
        "cron set review notification",
        result.receiverTeamCaptainId,
      ];
      const organiserCaptainSetResultPushNotificationBody = {
        to: result.organiserPushToken ?? "123",
        title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
        body: "Futuni ne aplikacion dhe vendosni rezultatin",
        data: { eventId: result.eventId, setResult: true },
      };
      const organiserCaptainSetReviewPushNotificationBody = {
        to: result.organiserPushToken ?? "123",
        title: `Eventi: ${result.eventName} ka perfunduar. Mund te beni vleresimet per lojtaret e ndeshjes`,
        body: "Futuni ne aplikacion dhe vleresoni lojtaret",
        data: { eventId: result.eventId, setReview: true },
      };
      const receiverCaptainSetResultPushNotificationBody = {
        to: result.receiverPushToken ?? "123",
        title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
        body: "Futuni ne aplikacion dhe vendosni rezultatin",
        data: { eventId: result.eventId, setResult: true },
      };
      const receiverCaptainSetReviewPushNotificationBody = {
        to: result.receiverPushToken ?? "123",
        title: `Eventi: ${result.eventName} ka perfunduar. Mund te beni vleresimet per lojtaret e ndeshjes`,
        body: "Futuni ne aplikacion dhe vleresoni lojtaret",
        data: { eventId: result.eventId, setReview: true },
      };
      notifications.push(organiserCaptainSetResultNotificationBody);
      notifications.push(organiserCaptainSetReviewNotificationBody);
      notifications.push(receiverCaptainSetResultNotificationBody);
      notifications.push(receiverCaptainSetReviewNotificationBody);
      pushNotifications.push(organiserCaptainSetResultPushNotificationBody);
      pushNotifications.push(organiserCaptainSetReviewPushNotificationBody);
      pushNotifications.push(receiverCaptainSetResultPushNotificationBody);
      pushNotifications.push(receiverCaptainSetReviewPushNotificationBody);
    }

    // 2- Update events query
    if (selectedEvents.length) {
      await eventsRepository
        .createQueryBuilder("events")
        .update(Event)
        .set({ completedCronSent: true })
        .where("events.id IN (:...ids)", { ids })
        .execute();

      console.log("update query");
    }

    // 3- Insert notification query
    if (notifications.length) {
      await notificationsRepository
        .createQueryBuilder("n")
        .insert()
        .values(
          notifications.map((item) => {
            return {
              payload: item[0],
              type: item[1],
              receiverId: item[2],
            };
          })
        )
        .execute();

      console.log("insert notification");

      // 4- Push notifications
      pushNotification(pushNotifications);
      console.log("send push notification");
    }
  }
};

export const checkForEventsTwoHoursLater = async () => {
  const notifications = [];
  const pushNotifications = [];
  const date = getCurrentDateTime();
  const eventsRepository = getRepository(Event);
  const teamUsersRepository = getRepository(TeamUsers);
  const requestRepository = getRepository(Request);
  const notificationsRepository = getRepository(Notification);
  const dateNow = new Date(date);
  const twoHoursLater = new Date(date.setHours(date.getHours() + 2));
  const selectEventsQuery = `SELECT
                              event.id as id,
                              event.name as name,
                              event.isTeam as isTeam,
                              event.organiserTeamId as organiserTeamId,
                              event.receiverTeamId as receiverTeamId
                                FROM events event
                                  WHERE ( status = 'confirmed' AND twoHoursBeforeCronSent = 0 AND startDate > '${dateNow.toISOString()}' AND startDate <= '${twoHoursLater.toISOString()}')
                                  AND ( event.ts_deleted IS NULL )`;

  // 1- Select events two hours later
  const selectedEvents = await eventsRepository.manager.query(selectEventsQuery);
  const ids = [];
  if (selectedEvents.length) {
    for (const event of selectedEvents) {
      ids.push(event.id);
      if (event.isTeam) {
        // 2- Select organiser and receiver teams players if event is team
        const selectOrganiserTeamPlayersQuery = `SELECT
                                                    tu.id as tuId,
                                                    tu.playerId as tuPlayerId,
                                                    tu.teamId as tuTeamId,
                                                    player.id as playerId,
                                                    player.pushToken as pushToken
                                                    FROM teams_users tu
                                                    LEFT JOIN users player ON player.id = tu.playerId AND (player.ts_deleted IS NULL)
                                                      WHERE (tu.teamId = ${event.organiserTeamId} AND tu.status = 'confirmed') AND (tu.ts_deleted IS NULL)`;

        const organiserTeamPlayers = await teamUsersRepository.manager.query(selectOrganiserTeamPlayersQuery);
        for (const player of organiserTeamPlayers) {
          const notificationBody = [
            JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              exponentPushToken: player.pushToken ?? "123",
              title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
              body: "Futuni ne aplikacion dhe shikoni me shume",
            }),
            "cron two hours later event notification",
            player.playerId,
          ];

          const pushNotificationBody = {
            to: player.pushToken ?? "123",
            title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
            body: "Futuni ne aplikacion dhe shikoni me shume",
            data: { eventId: event.id },
          };
          notifications.push(notificationBody);
          pushNotifications.push(pushNotificationBody);
        }
        const selectReceiverTeamPlayersQuery = `SELECT
                                                    tu.id as tuId,
                                                    tu.playerId as tuPlayerId,
                                                    tu.teamId as tuTeamId,
                                                    player.id as playerId,
                                                    player.pushToken as pushToken
                                                    FROM teams_users tu
                                                    LEFT JOIN users player ON player.id = tu.playerId AND (player.ts_deleted IS NULL)
                                                      WHERE (tu.teamId = ${event.receiverTeamId} AND tu.status = 'confirmed') AND (tu.ts_deleted IS NULL)`;

        const receiverTeamPlayers = await teamUsersRepository.manager.query(selectReceiverTeamPlayersQuery);
        for (const player of receiverTeamPlayers) {
          const notificationBody = [
            JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              exponentPushToken: player.pushToken ?? "123",
              title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
              body: "Futuni ne aplikacion dhe shikoni me shume",
            }),
            "cron two hours later event notification",
            player.playerId,
          ];

          const pushNotificationBody = {
            to: player.pushToken ?? "123",
            title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
            body: "Futuni ne aplikacion dhe shikoni me shume",
            data: { eventId: event.id },
          };
          notifications.push(notificationBody);
          pushNotifications.push(pushNotificationBody);
        }
      } else {
        // 2- select event players
        const selectEventPlayersQuery = `SELECT
                                            r.id as id,
                                            r.receiverId as receiverId,
                                            r.eventId as eventId,
                                            user.id as playerId,
                                            user.pushToken as pushToken
                                            FROM requests r
                                            LEFT JOIN users user ON user.id = r.receiverId AND (user.ts_deleted IS NULL)
                                              WHERE (r.eventId = ${event.id} AND r.status = 'confirmed') AND (r.ts_deleted IS NULL)`;

        const eventPlayers = await requestRepository.manager.query(selectEventPlayersQuery);
        for (const player of eventPlayers) {
          const notificationBody = [
            JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              exponentPushToken: player.pushToken ?? "123",
              title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
              body: "Futuni ne aplikacion dhe shikoni me shume",
            }),
            "cron two hours later event notification",
            player.receiverId,
          ];

          const pushNotificationBody = {
            to: player.pushToken ?? "123",
            title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
            body: "Futuni ne aplikacion dhe shikoni me shuresult.organiserTeamCaptainIdme",
            data: { eventId: event.id },
          };
          notifications.push(notificationBody);
          pushNotifications.push(pushNotificationBody);
        }
      }
    }
  }

  // 2- Update events query
  if (ids.length) {
    await eventsRepository
      .createQueryBuilder("events")
      .update(Event)
      .set({ twoHoursBeforeCronSent: true })
      .where("events.id IN (:...ids)", { ids })
      .execute();

    console.log("update query");
  }

  // 3- Insert notification query
  if (notifications.length) {
    await notificationsRepository
      .createQueryBuilder("n")
      .insert()
      .values(
        notifications.map((item) => {
          return {
            payload: item[0],
            type: item[1],
            receiverId: item[2],
          };
        })
      )
      .execute();
    console.log("insert notification");

    // 4- Push notifications
    pushNotification(pushNotifications);
    console.log("send push notification");
  }
};

export const checkForEventsTomorrow = async () => {
  const notifications = [];
  const pushNotifications = [];
  const date = getCurrentDateTime();
  const eventsRepository = getRepository(Event);
  const teamUsersRepository = getRepository(TeamUsers);
  const requestsRepository = getRepository(Request);
  const notificationsRepository = getRepository(Notification);
  const dateNow = new Date(date);
  const oneDayLater = new Date(date.setHours(date.getHours() + 38));
  const selectEventsQuery = `SELECT
                              event.id as id,
                              event.name as name,
                              event.isTeam as isTeam,
                              event.organiserTeamId as organiserTeamId,
                              event.receiverTeamId as receiverTeamId
                                FROM events event
                                  WHERE ( status = 'confirmed' AND twoHoursBeforeCronSent = 0 AND startDate > '${dateNow.toISOString()}' AND startDate <= '${oneDayLater.toISOString()}')
                                  AND ( event.ts_deleted IS NULL )`;
  const insertNotificationQuery = `INSERT INTO notifications(payload, type, receiverId) VALUES ?`;

  // 1- Select events two hours later
  const tomorrowEvents = await eventsRepository.manager.query(selectEventsQuery);
  const ids = [];
  if (tomorrowEvents.length) {
    for (const event of tomorrowEvents) {
      ids.push(event.id);
      if (event.isTeam) {
        // 2- Select organiser and receiver teams players if event is team
        const selectOrganiserTeamPlayersQuery = `SELECT
                                                    tu.id as tuId,
                                                    tu.playerId as tuPlayerId,
                                                    tu.teamId as tuTeamId,
                                                    player.id as playerId,
                                                    player.pushToken as pushToken
                                                    FROM teams_users tu
                                                    LEFT JOIN users player ON player.id = tu.playerId AND (player.ts_deleted IS NULL)
                                                      WHERE (tu.teamId = ${event.organiserTeamId} AND tu.status = 'confirmed') AND (tu.ts_deleted IS NULL)`;
        const organiserTeamPlayers = await teamUsersRepository.manager.query(selectOrganiserTeamPlayersQuery);
        for (const player of organiserTeamPlayers) {
          const notificationBody = [
            JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              exponentPushToken: player.pushToken ?? "123",
              title: `Rikujtese! Eventi: ${event.name} nis pas 2 oresh.`,
              body: "Futuni ne aplikacion dhe shikoni me shume",
            }),
            "cron tomorrow event notification",
            player.playerId,
          ];

          const pushNotificationBody = {
            to: player.pushToken ?? "123",
            title: `Rikujtese! Eventi: ${event.name} zhvillohet neser.`,
            body: "Futuni ne aplikacion dhe shikoni me shume",
            data: { eventId: event.id },
          };
          notifications.push(notificationBody);
          pushNotifications.push(pushNotificationBody);
        }
        const selectReceiverTeamPlayersQuery = `SELECT
                                                    tu.id as tuId,
                                                    tu.playerId as tuPlayerId,
                                                    tu.teamId as tuTeamId,
                                                    player.id as playerId,
                                                    player.pushToken as pushToken
                                                    FROM teams_users tu
                                                    LEFT JOIN users player ON player.id = tu.playerId AND (player.ts_deleted IS NULL)
                                                      WHERE (tu.teamId = ${event.receiverTeamId} AND tu.status = 'confirmed') AND (tu.ts_deleted IS NULL)`;

        const receiverTeamPlayers = await teamUsersRepository.manager.query(selectReceiverTeamPlayersQuery);
        for (const player of receiverTeamPlayers) {
          const notificationBody = [
            JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              exponentPushToken: player.pushToken ?? "123",
              title: `Rikujtese! Eventi: ${event.name} zhvillohet neser.`,
              body: "Futuni ne aplikacion dhe shikoni me shume",
            }),
            "cron tomorrow event notification",
            player.playerId,
          ];

          const pushNotificationBody = {
            to: player.pushToken ?? "123",
            title: `Rikujtese! Eventi: ${event.name} zhvillohet neser.`,
            body: "Futuni ne aplikacion dhe shikoni me shume",
            data: { eventId: event.id },
          };
          notifications.push(notificationBody);
          pushNotifications.push(pushNotificationBody);
        }
      } else {
        // 2- select event players
        const selectEventPlayersQuery = `SELECT
                                            r.id as id,
                                            r.receiverId as receiverId,
                                            r.eventId as eventId,
                                            user.id as playerId,
                                            user.pushToken as pushToken
                                            FROM requests r
                                            LEFT JOIN users user ON user.id = r.receiverId AND (user.ts_deleted IS NULL)
                                              WHERE (r.eventId = ${event.id} AND r.status = 'confirmed') AND (r.ts_deleted IS NULL)`;

        const eventPlayers = await requestsRepository.manager.query(selectEventPlayersQuery);
        for (const player of eventPlayers) {
          const notificationBody = [
            JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              exponentPushToken: player.pushToken ?? "123",
              title: `Rikujtese! Eventi: ${event.name} zhvillohet neser.`,
              body: "Futuni ne aplikacion dhe shikoni me shume",
            }),
            "cron two hours later event notification",
            player.receiverId,
          ];

          const pushNotificationBody = {
            to: player.pushToken ?? "123",
            title: `Rikujtese! Eventi: ${event.name} zhvillohet neser.`,
            body: "Futuni ne aplikacion dhe shikoni me shume",
            data: { eventId: event.id },
          };
          notifications.push(notificationBody);
          pushNotifications.push(pushNotificationBody);
        }
      }
    }

    // 3- Insert notification query
    if (notifications.length) {
      await notificationsRepository
        .createQueryBuilder("n")
        .insert()
        .values(
          notifications.map((item) => {
            return {
              payload: item[0],
              type: item[1],
              receiverId: item[2],
            };
          })
        )
        .execute();
      console.log("insert notification");

      // 4- Push notifications
      pushNotification(pushNotifications);
      console.log("send push notification");
    }
  }
};

const pushNotification = async (payload) => {
  const PUSH_TOKEN_BASE_API = "https://exp.host/--/api/v2/push/send";
  const headers = {
    host: "exp.host",
    accept: "application/json",
    "accept-encoding": "gzip, deflate",
    "content-type": "application/json",
  };

  for (const body of payload) {
    const response = await axios.post(PUSH_TOKEN_BASE_API, body, { headers });
  }
};
