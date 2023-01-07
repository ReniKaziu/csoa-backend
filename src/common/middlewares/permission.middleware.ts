import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../utilities/ErrorResponse";
import { ERROR_MESSAGES } from "../utilities/ErrorMessages";
import { UserRole } from "../../user/utilities/UserRole";
import { getRepository } from "typeorm";
import { Complex } from "../../complex/entities/complex.entity";
import { User } from "../../user/entities/user.entity";
import { Event } from "../../event/entities/event.entity";
import { Team } from "../../team/entities/team.entity";

export class PermissionMiddleware {
  static checkAllowedPermissions = (roles: Array<string>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { userRole } = res.locals.jwt;

      if (userRole && roles.indexOf(userRole) > -1) {
        next();
      } else {
        res.status(403).send(ERROR_MESSAGES.NOT_AUTHORIZED);
      }
    };
  };

  static checkMeOrPermissionsAllowed = (roles: Array<string>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const { userId, userRole } = res.locals.jwt;

      if (req.params && req.params.userId && req.params.userId === userId) {
        return next();
      }

      if (userRole && roles.indexOf(userRole) > -1) {
        next();
      } else {
        res.status(403).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
      }
    };
  };

  static checkNotMe = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals.jwt;

    if (req.params && req.params.userId && req.params.userId === userId) {
      return res.status(403).send(ERROR_MESSAGES.NOT_AUTHORIZED);
    }

    next();
  };

  static checkIfOwner = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, userRole } = res.locals.jwt;
    if (userRole === UserRole.ADMIN) {
      next();
    } else if (userRole === UserRole.COMPNAY) {
      const complex = await getRepository(Complex)
        .createQueryBuilder("c")
        .innerJoin("users", "u", "u.complexId = c.id")
        .where("u.id = :id", { id: userId })
        .andWhere("u.complexId = :complexId", { complexId: req.params.id })
        .getRawOne();

      if (complex) {
        next();
      } else {
        res.status(403).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
      }
    }
  };

  static checkIfEventCreatorOrCompany = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, userRole } = res.locals.jwt;
    if (userRole === UserRole.ADMIN) {
      next();
    } else if (userRole === UserRole.USER) {
      const event = await getRepository(Event)
        .createQueryBuilder("e")
        .where("e.id = :eventId", { eventId: req.params.eventId })
        .andWhere("e.creatorId = :id", { id: userId })
        .getOne();
      if (event) {
        next();
      } else {
        res.status(403).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
      }
    } else if (userRole === UserRole.COMPNAY) {
      const event = await getRepository(Event)
        .createQueryBuilder("e")
        .leftJoinAndSelect("e.location", "l")
        .leftJoinAndSelect("l.complex", "c")
        .where("e.id = :eventId", { eventId: req.params.eventId })
        .getOne();

      const complex = await getRepository(Complex)
        .createQueryBuilder("c")
        .leftJoin("locations", "l", "l.complexId = c.id")
        .leftJoin("users", "u", "u.complexId = c.id")
        .where("l.id = :locationId", { locationId: event.locationId })
        .andWhere("u.id = :id", { id: userId })
        .andWhere("u.complexId = :complexId", {
          complexId: event.location.complexId,
        })
        .getRawOne();
      if (complex) {
        next();
      } else {
        res.status(403).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
      }
    } else {
      res.status(403).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
    }
  };

  static checkIfTeamCreator = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals.jwt;
    const teamId = req.params.teamId;
    console.log({ teamId });
    console.log({ userId });

    const team = await getRepository(Team)
      .createQueryBuilder("t")
      .where("t.id = :id", { id: teamId })
      .andWhere("t.userId = :creatorId", { creatorId: userId })
      .getOne();
    if (team) {
      next();
    } else {
      res.status(403).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
    }
  };
}
