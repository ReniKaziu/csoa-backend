import { Request, Response, NextFunction } from "express";
import { getRepository, IsNull } from "typeorm";
import { User } from "../entities/user.entity";
import { Functions } from "../../common/utilities/Functions";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import {
  ERROR_CODES,
  ERROR_MESSAGES,
} from "../../common/utilities/ErrorMessages";
import { UserRole } from "../utilities/UserRole";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
const Joi = require("@hapi/joi");

export class UserMiddleware {
  static validateInsertInput = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const registerInput = Joi.object().keys({
      name: Joi.string().required(),
      surname: Joi.string().required(),
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      role: Joi.string().valid(UserRole.ADMIN, UserRole.USER),
      password: Joi.string().min(8).required(),
      profilePicture: Joi.string(),
      phoneNumber: Joi.string(),
    });

    const result = registerInput.validate(request.body, { abortEarly: false });

    if (!Helper.isDefined(result.error)) {
      next();
    } else {
      return response
        .status(400)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };

  static checkUserExistance = (
    column: string,
    requestPath: any,
    exists: boolean
  ) => {
    return async (request: Request, response: Response, next: NextFunction) => {
      const userRepository = getRepository(User);

      const columnValue = Functions.getObjectPath(
        request,
        requestPath.split(".")
      );

      const whereCondition = {};

      whereCondition[column] = columnValue;

      const user = await userRepository.findOne({
        where: whereCondition,
      });

      if (exists) {
        if (Helper.isDefined(user)) {
          next();
        } else {
          return response
            .status(404)
            .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
        }
      } else {
        if (Helper.isDefined(user)) {
          return response
            .status(400)
            .send(new ErrorResponse(ERROR_MESSAGES.RECORD_ALREADY_EXIST));
        } else {
          next();
        }
      }
    };
  };

  static validationPatchByIdInput = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const registerInput = Joi.object().keys({
      name: Joi.string().not(""),
      surname: Joi.string().not(""),
      email: Joi.string().email({ minDomainSegments: 2 }),
      role: Joi.string().valid(UserRole.ADMIN, UserRole.USER),
      password: Joi.string().min(8),
      profilePicture: Joi.string(),
    });

    const result = registerInput.validate(request.body, { abortEarly: false });

    if (!Helper.isDefined(result.error)) {
      next();
    } else {
      return response
        .status(400)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };

  static validationPasswordInput = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const registerInput = Joi.object().keys({
      newPassword: Joi.string().allow(null, "").optional(),
      confirmPassword: Joi.string()
        .allow(Joi.ref("newPassword"))
        .allow(null, ""),
      phoneNumber: Joi.string().allow(null, "").optional(),
      name: Joi.string().optional(),
      surname: Joi.string().optional(),
      email: Joi.string().email().required(),
    });

    const result = registerInput.validate(request.body, { abortEarly: false });

    if (!Helper.isDefined(result.error)) {
      next();
    } else {
      return response
        .status(HttpStatusCode.BAD_REQUEST)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };
}
