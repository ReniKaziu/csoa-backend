import { Request, Response, NextFunction, request } from "express";
import * as jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { User } from "../../user/entities/user.entity";
import { permissions } from "../../user/utilities/UserRole";
const Joi = require("@hapi/joi");

export class AuthenticationMiddleware {
  static hasLoginValidFields = async (req: Request, res: Response, next: NextFunction) => {
    //Register input
    const loginInput = Joi.object().keys({
      username: Joi.string().required(),
      password: Joi.string().required(),
    });

    const result = loginInput.validate(req.body, { abortEarly: false });

    if (result.error === null) {
      next();
    } else {
      return res.status(400).send(new ErrorResponse(ERROR_MESSAGES.VALIDATION_ERROR, result.error.details));
    }
  };

  static checkJwtToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");
    if (token) {
      try {
        const jwtPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        res.locals.jwt = jwtPayload;
        next();
      } catch (error) {
        console.log({ error });
        return res.status(401).send(new ErrorResponse(ERROR_MESSAGES.ACCESS_TOKEN_INVALID));
      }
    } else {
      return res.status(401).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHENTICATED));
    }
  };

  static validateRefreshTokenInput = async (req: Request, res: Response, next: NextFunction) => {
    const refreshTokenInput = Joi.object().keys({
      refresh_token: Joi.string().required(),
    });

    const result = refreshTokenInput.validate(req.body, { abortEarly: false });

    if (result.error === null) {
      next();
    } else {
      return res.status(400).send(new ErrorResponse(ERROR_MESSAGES.VALIDATION_ERROR, result.error.details));
    }
  };

  static verifyUserByEmail = async (request: Request, response: Response, next: NextFunction) => {
    const { username } = request.body;

    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: {
        username: username,
        isVerified: true,
      },
    });

    if (!user) {
      return response.status(HttpStatusCode.FORBIDDEN).send(HttpStatusCode.FORBIDDEN);
    }

    next();
  };

  static verifyUserByToken = async (request: Request, response: Response, next: NextFunction) => {
    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: {
        id: response.locals.jwt.userId,
        isVerified: true,
      },
    });

    if (!user) {
      return response.status(HttpStatusCode.FORBIDDEN).send(HttpStatusCode.FORBIDDEN);
    }

    next();
  };

  static checkJwtTokenOptional = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");

    try {
      const jwtPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
      res.locals.jwt = jwtPayload;
      next();
    } catch (error) {
      next();
    }
  };

  static checkIfFieldsAllowed = (request: Request, response: Response, next: NextFunction) => {
    for (const key in request.body) {
      if (
        response.locals.jwt &&
        (response.locals.jwt.userRole === "admin" ||
          response.locals.jwt.userRole === "hc" ||
          response.locals.jwt.userRole === "company")
      )
        break;

      if (!response.locals.jwt) {
        if (!permissions.filter.noAuth.includes(key)) delete request.body[key];
      } else {
        if (!permissions.filter[response.locals.jwt.userRole].includes(key)) {
          return response.status(HttpStatusCode.FORBIDDEN).send(HttpStatusCode.FORBIDDEN);
        }
      }
    }
    next();
  };
}
