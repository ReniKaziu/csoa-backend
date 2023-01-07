import "reflect-metadata";
require('dotenv').config();
import * as express from 'express';
import * as cors from "cors";
import * as bodyParser from "body-parser";
import { AuthenticationRouter } from '../../src/authentication/authentication.router';
import { UserRouter } from '../../src/user/user.router';

const app = express();

// app.use(cors())
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

//Authentication routes
AuthenticationRouter.configRoutes(app);

//User routes
UserRouter.configRoutes(app);

// get api version
app.get(process.env.URL + '/version', (req, res) => {
    res.status(200).send({
        success: true,
        message: 'the api call is successfull',
        body: {
            version: process.env.VERSION
        }
    })
});

module.exports = app;





