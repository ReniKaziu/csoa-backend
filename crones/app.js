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

//  query example
// connection.query(
//   'Select * from users',
//   function (err, results, fields) {
//     console.log({ results }); // results contains rows returned by server
//   }
// );

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
  const insertNotificationQuery = `INSERT INTO notifications(id, ts_created, ts_last_modified, ts_deleted, isRead, payload, type, complexId, senderId, receiverId) VALUES ?`;

  // 1- Select events to be updated query
  connection.query(selectEventsQuery, (err, results, fields) => {
    if (results && results.length) {
      const ids = [];
      for (const result of results) {
        ids.push(result.eventId);
        const eventNotification = [];
        const organiserCaptainNotificationBody = {
          receiverId: result.organiserTeamCaptainId,
          type: "cron update result notification",
          payload: {
            eventId: result.eventId,
            eventName: result.eventName,
            exponentPushToken: result.organiserPushToken,
            title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
            body: "Futuni ne aplikacion dhe vendosni rezultatin",
          },
        };
        const receiverCaptainNotificationBody = {
          receiverId: result.receiverTeamCaptainId,
          type: "cron update result notification",
          payload: {
            eventId: result.eventId,
            eventName: result.eventName,
            exponentPushToken: result.receiverPushToken,
            title: `Eventi: ${result.eventName} ka perfunduar. Mund te vendosni rezultatin e ndeshjes`,
            body: "Futuni ne aplikacion dhe vendosni rezultatin",
          },
        };
        eventNotification.push(organiserCaptainNotificationBody);
        eventNotification.push(receiverCaptainNotificationBody);
        notifications.push(eventNotification);
      }

      // 2- Update events query
      connection.query(updateEventsQuery, ids, (err, updateResults) => {
        console.log("update query");
      });

      // 3- Insert notification query
      connection.query(insertNotificationQuery, notifications, (err, results, fields) => {
        console.log(notifications);
        console.log("result from notif", results);
        // console.log("insert notification");
      });
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

new CronJob("*/2 * * * * *", checkForCompletedEvents, null, true, "Europe/Rome");
