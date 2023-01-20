require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const createConnection = require('./mysqlconfig')
const axios = require('axios').default;
const CronJob = require('cron').CronJob;

const app = express();

// Middleware
app.use(cors())
app.use(bodyParser.json());

const host = process.env.DB_HOST
const user = process.env.DB_USER
const database = process.env.DB_NAME
const password = process.env.DB_PASSWORD


const connection = createConnection['createConnection'](host, user, database, password)

//  query example
// connection.query(
//   'Select * from users',
//   function (err, results, fields) {
//     console.log({ results }); // results contains rows returned by server
//   }
// );

function subtractDays(numOfDays, date) {
  date.setDate(date.getDate() - numOfDays);

  return date;
}

function subtractHours(numOfHours, date) {
  date.setHours(date.getHours() - numOfHours);

  return date;
}

function getParams(date) {
  return {
    month: date.getMonth(),
    dayOfMonth: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    dayOfWeek: date.getDay(),
  }
}

app.post("/crones/confirmed-session-reminder", (req, res) => {
  const days = subtractDays(req.body.days, new Date(req.body.startTime))
  const hours = subtractHours(req.body.hours, new Date(req.body.startTime))

  daysParams = getParams(days)
  hoursParams = getParams(hours)


  const daysJob = new CronJob(
    `${daysParams.minute} ${daysParams.hour} ${daysParams.dayOfMonth} ${daysParams.month} ${daysParams.dayOfWeek}`,
    function () {
      axios.post(process.env.MAIN_SERVER_URL + "/sessions/crones/reminder?sessionId=" + req.body.sessionId, {
        ...req.body,
        amount: req.body.days,
        daysOrHours: "day(s)",
      })
    },
    null,
    true,
    'Europe/Rome'
  );

  const hoursJob = new CronJob(
    `${hoursParams.minute} ${hoursParams.hour} ${hoursParams.dayOfMonth} ${hoursParams.month} ${hoursParams.dayOfWeek}`,
    function () {
      axios.post(process.env.MAIN_SERVER_URL + "/sessions/crones/reminder?sessionId=" + req.body.sessionId, {
        ...req.body,
        amount: req.body.hours,
        daysOrHours: "hour(s)",
      })
    },
    null,
    true,
    'Europe/Rome'
  );

  res.sendStatus(200)
})

app.get("/crones/clean-up", (req, res) => {
  const hoursJob = new CronJob(
    `* * * * * * `,
    function () {
      connection.query(
        `select u.id from  sessions
    join patientsDoctors pD on pD.id = sessions.patientDoctorId
    join users u on pD.patientId = u.id
    where sessions.startTime < NOW()
    and sessions.isConfirmed = 0`,
        function (err, results, fields) {
          const inactiveUsersIds = results.map(result => result.id)
          if (inactiveUsersIds.length) {
            connection.query(
              'update users set users.isActive = 0 where users.id in (?)', [inactiveUsersIds],
              function (err, innerResults) {
                console.log("from inside :", { innerResults })
              }
            );
          }
        }
      );
    },
    null,
    true,
    'Europe/Rome'
  );

  res.sendStatus(200)
})

app.get("/test-mysql", async (request, response ) => {
  connection.query(`SELECT * from giftCards where code like '%34%' and price > 60`, function (error, results, fields) {
    if (error) throw error;
    // console.log('The solution is: ', JSON.stringify(results));
    return response.send({results})
  });
 })


app.listen(process.env.PORT, () => {
  console.log(`Crone server starting on port: ${process.env.PORT} at ${new Date().toISOString().slice(0, 19).replace('T', ' ') }`)
})

