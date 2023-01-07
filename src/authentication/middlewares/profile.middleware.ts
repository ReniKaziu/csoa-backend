import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
const Joi = require("@hapi/joi");

export class ProfileMiddleware {
  static validateRegisterInput = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    //Register input
    const registerInput = Joi.object().keys({
      name: Joi.string().required(),
      surname: Joi.string().required(),
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      password: Joi.string().min(8).required(),
      phoneNumber: Joi.string().optional().allow("").allow(null),
    });

    const result = registerInput.validate(req.body, { abortEarly: false });

    if (result.error === null) {
      next();
    } else {
      return res
        .status(400)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };

  static validateForgotPasswordInput = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    //Forogot password input
    const forgotPasswordInput = Joi.object().keys({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
    });

    const result = forgotPasswordInput.validate(req.body, {
      abortEarly: false,
    });

    if (result.error === null) {
      next();
    } else {
      return res
        .status(400)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };

  static validateChangePasswordInput = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const registerInput = Joi.object().keys({
      token: Joi.string().required(),
      password: Joi.string().min(1).required(),
    });

    const result = registerInput.validate(req.body, { abortEarly: false });

    if (result.error === null) {
      next();
    } else {
      return res
        .status(400)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };

  static validateVerifyInput = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const verifyInput = Joi.object().keys({
      token: Joi.string().required(),
    });

    const result = verifyInput.validate(req.body, { abortEarly: false });

    if (result.error === null) {
      next();
    } else {
      return res
        .status(400)
        .send(
          new ErrorResponse(
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.error.details
          )
        );
    }
  };
}
