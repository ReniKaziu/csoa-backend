import * as express from "express";
const swaggerUi = require('swagger-ui-express');
import * as swaggerJson from './swagger.json';

export class DocRouter {
    
    static configRoutes = (app: express.Application) => {
        
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJson));
    }
}