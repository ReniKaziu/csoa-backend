require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const createConnection = require("./mysqlconfig");
const axios = require("axios").default;
const CronJob = require("cron").CronJob;

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const database = process.env.DB_NAME;
const password = process.env.DB_PASSWORD;

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

const connection = createConnection["createConnection"](host, user, database, password);

const checkForCompletedEvents = () => {
  const notifications = [];
  const pushNotifications = [];
  const dateNow = getCurrentDateTime();
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
                                  WHERE status = 'confirmed' AND result IS NULL AND isSent = 0 AND endDate < '${dateNow.toISOString()}'`;
  const updateEventsQuery = `UPDATE events SET events.isSent = 1 WHERE events.id IN (?)`;
  const insertNotificationQuery = `INSERT INTO notifications(payload, type, receiverId) VALUES ?`;

  // 1- Select events to be updated query
  connection.query(selectEventsQuery, (err, results, fields) => {
    if (results && results.length) {
      const ids = [];
      for (const result of results) {
        ids.push(result.eventId);
        const organiserCaptainNotificationBody = [
          JSON.stringify({
            eventId: result.eventId,
            eventName: result.eventName,
            exponentPushToken: result.organiserPushToken ?? "123",
            title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
            body: "Futuni ne aplikacion dhe vendosni rezultatin",
          }),
          "cron update result notification",
          result.organiserTeamCaptainId,
        ];
        const receiverCaptainNotificationBody = [
          JSON.stringify({
            eventId: result.eventId,
            eventName: result.eventName,
            exponentPushToken: result.receiverPushToken ?? "123",
            title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
            body: "Futuni ne aplikacion dhe vendosni rezultatin",
          }),
          "cron update result notification",
          result.receiverTeamCaptainId,
        ];
        const organiserPushNotificationBody = {
          to: result.organiserPushToken ?? "123",
          title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
          body: "Futuni ne aplikacion dhe vendosni rezultatin",
          data: { eventId: result.eventId },
        };
        const receiverPushNotificationBody = {
          to: result.receiverPushToken ?? "123",
          title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
          body: "Futuni ne aplikacion dhe vendosni rezultatin",
          data: { eventId: result.eventId },
        };
        notifications.push(organiserCaptainNotificationBody);
        notifications.push(receiverCaptainNotificationBody);
        pushNotifications.push(organiserPushNotificationBody);
        pushNotifications.push(receiverPushNotificationBody);
      }

      // 2- Update events query
      connection.query(updateEventsQuery, ids, (err, updateResults) => {
        console.log("update query");
      });

      // 3- Insert notification query
      connection.query(insertNotificationQuery, [notifications], (err, results, fields) => {
        console.log("insert notification");
      });

      // 4- Push notifications
      pushNotification(pushNotifications);
    }
  });
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
    const response = await Axios.post(PUSH_TOKEN_BASE_API, body, { headers });
  }
};

new CronJob("*/15 * * * *", checkForCompletedEvents, null, true, "Europe/Rome");
