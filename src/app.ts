import "reflect-metadata";
require("dotenv").config();
import express = require("express");
import * as cors from "cors";
import * as bodyParser from "body-parser";
import { UserRouter } from "./user/user.router";
import { createConnection } from "typeorm";
import { AuthenticationRouter } from "./authentication/authentication.router";
import { DocRouter } from "./doc/doc.router";
import { AttachmentRouter } from "./attachment/attachment.router";
import https = require("https");
import fs = require("fs");
var app = express();
import { join } from "path";
import { TeamRouter } from "./team/team.router";
import { DashboardRouter } from "./dashboard/dashboard.router";
import { EventRouter } from "./event/event.router";
import { RequestRouter } from "./request/request.router";
import { ReviewRouter } from "./review/review.router";
import { NotificationRouter } from "./notifications/notification.router";
import { ComplexRouter } from "./complex/complex.router";
import { TeamUsersRouter } from "./team/team.users.router";

createConnection()
  .then(async (connection) => {
    // await connection.query(`SET GLOBAL time_zone = '+00:00';`);
    // await connection.query(`SET time_zone = '+00:00';`);
    app.use(cors());
    app.use(bodyParser.json({ limit: "200mb" }));
    app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
    app.use(express.static(join(__dirname, "..", "public")));
    //app.use(expressFormidable());

    DocRouter.configRoutes(app);

    AuthenticationRouter.configRoutes(app);

    UserRouter.configRoutes(app);

    TeamRouter.configRoutes(app);

    TeamUsersRouter.configRoutes(app);

    EventRouter.configRoutes(app);

    RequestRouter.configRoutes(app);

    ReviewRouter.configRoutes(app);

    NotificationRouter.configRoutes(app);

    AttachmentRouter.configRoutes(app);

    DashboardRouter.configRoutes(app);

    ComplexRouter.configRoutes(app);
    // get api version
    app.get(process.env.URL + "/version", (req, res) => {
      res.status(200).send({
        success: true,
        message: "the api call is successfull",
        body: {
          version: process.env.VERSION,
        },
      });
    });

    const port = process.env.PORT || 4500;

    if (process.env.SSL_LOCATION) {
      const privateKey = fs.readFileSync(process.env.SSL_LOCATION + "/privkey.pem", "utf8");
      const certificate = fs.readFileSync(process.env.SSL_LOCATION + "/cert.pem", "utf8");
      const ca = fs.readFileSync(process.env.SSL_LOCATION + "/chain.pem", "utf8");
      const credentials = {
        key: privateKey,
        cert: certificate,
        ca,
      };
      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(port, () => {
        return console.log(`server is listening on ${port}`);
      });
    } else {
      app.listen(port, () => {
        return console.log(`server is listening on ${port}`);
      });
    }
  })
  .catch((error) => console.log(error));
