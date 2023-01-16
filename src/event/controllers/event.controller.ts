import { Request, Response } from "express";
import { getRepository, In, LessThan, Not } from "typeorm";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { Mailer } from "../../common/utilities/Mailer";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { Complex } from "../../complex/entities/complex.entity";
import { Location } from "../../complex/entities/location.entity";
import { NotificationType } from "../../notifications/entities/notification.entity";
import { NotificationService } from "../../notifications/services/notification.services";
import { User } from "../../user/entities/user.entity";
import { UserService } from "../../user/services/user.service";
import { UserRole } from "../../user/utilities/UserRole";
import { Event, EventStatus } from "../entities/event.entity";
import { EventService } from "../services/event.services";

export class EventController {
  static listMyEvents = async (request: Request, response: Response) => {
    try {
      const results = await EventService.listMyEvents(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get my events list"));
    }
  };

  static list = async (request: Request, response: Response) => {
    try {
      const { events, count } = await EventService.list(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ events, count }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get my events"));
    }
  };

  public static async toggleEvent(request: Request, response: Response) {
    try {
      const eventRepository = getRepository(Event);
      const event = await eventRepository.findOneOrFail({
        where: { id: +request.params.id },
        withDeleted: true,
      });
      if (!event.tsDeleted) await eventRepository.softDelete(event.id);
      else {
        event.tsDeleted = null;
        await eventRepository.save(event);
      }
      return response.status(200).send(new SuccessResponse({ event }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not update event status"));
    }
  }

  static getPlayers = async (request: Request, response: Response) => {
    try {
      const players = await EventService.getPlayers(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ players }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get my players"));
    }
  };

  static insert = async (request: Request, response: Response) => {
    try {
      const event = await EventService.insert(request, response);
      if (event) {
        if (!event[0].isTeam) {
          await EventService.createDummyTeams(event);
        }
        await EventService.createRequest(event);
      }
      response.status(HttpStatusCode.OK).send(
        new SuccessResponse({
          event: event ? event : "Nje event ekziston ne kete orar",
        })
      );
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static createAdminEvent = async (request: Request, response: Response) => {
    try {
      const event = await EventService.createAdminEvent(request, response);
      const location = await getRepository(Location).findOne(event.locationId);
      const user = await getRepository(User).findOne({
        where: { complexId: location.complexId },
      });
      const mailer = new Mailer();
      mailer.sendMail(
        user.email,
        "Rezervim i ri",
        `
      <div>
      Pershendetje, ju keni nje rezervim te ri, vizitoni aplikacionin ose panelin per me shume detaje.
      </div>
      `
      );
      if (!event) throw Error();
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ event }));
    } catch (err) {
      console.log(err);
      return response.status(404).send(new ErrorResponse("Eventi nuk u krijua"));
    }
  };

  static confirm = async (request: Request, response: Response) => {
    const weeklyGroupedId = +request.query.weeklyGroupedId;
    const firstArgument = {
      ...(!weeklyGroupedId && { id: +request.params.eventId }),
      ...(weeklyGroupedId && { weeklyGroupedId }),
    };
    const foundEvent = await EventService.findById(+request.params.eventId, false);
    try {
      const event = await getRepository(Event).update(firstArgument, {
        status: EventStatus.CONFIRMED,
      });

      const creator = await getRepository(User).findOne({
        where: { id: foundEvent.creatorId },
      });
      await NotificationService.createEventNotification(
        creator.id,
        NotificationType.EVENT_CONFIRMED,
        foundEvent.id,
        foundEvent.name,
        creator.pushToken
      );

      return response.status(HttpStatusCode.OK).send(new SuccessResponse(event));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get my events"));
    }
  };

  static delete = async (request: Request, response: Response) => {
    const weeklyGroupedId = +request.query.weeklyGroupedId;
    const event = await EventService.getById(+request.params.eventId);
    let newStatus = "";
    if (!event.isUserReservation) {
      newStatus = EventStatus.CANCELED;
    }
    if (event.isUserReservation && response.locals.jwt.userRole === UserRole.USER) {
      newStatus = EventStatus.CANCELED;
    } else {
      newStatus = EventStatus.REFUSED;
    }
    try {
      await getRepository(Event).update(
        {
          ...(!weeklyGroupedId && { id: +request.params.eventId }),
          status: In([EventStatus.DRAFT, EventStatus.WAITING_FOR_CONFIRMATION]),
          ...(weeklyGroupedId && { weeklyGroupedId }),
        },
        {
          status: newStatus,
          tsDeleted: new Date(),
          deletedById: response.locals.jwt.userId,
        }
      );

      if (response.locals.jwt.userRole === UserRole.USER) {
        const complexAdmin = await getRepository(User).findOne({
          where: { complexId: event.location.complex.id },
        });
        await NotificationService.createEventNotification(
          complexAdmin.id,
          NotificationType.EVENT_DELETED_BY_USER_BEFORE_CONFIRMATION,
          event.id,
          event.name,
          complexAdmin.pushToken
        );
      }
      if (response.locals.jwt.userRole === UserRole.COMPNAY) {
        const creator = await getRepository(User).findOne({
          where: { id: event.creatorId },
        });
        await NotificationService.createEventNotification(
          creator.id,
          NotificationType.EVENT_REFUSED_BY_COMPLEX,
          event.id,
          event.name,
          creator.pushToken
        );
      }

      return response.status(HttpStatusCode.OK).send(new SuccessResponse("Eventi u fshi"));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Nuk mund te fshihej eventi!"));
    }
  };

  static cancel = async (request: Request, response: Response) => {
    const weeklyGroupedId = +request.query.weeklyGroupedId;
    const eventId = +request.params.eventId;
    const event = await EventService.getById(eventId);
    let newStatus = "";
    if (!event.isUserReservation) {
      newStatus = EventStatus.CANCELED;
    }
    if (event.isUserReservation && response.locals.jwt.userRole === UserRole.USER) {
      newStatus = EventStatus.CANCELED;
    } else {
      newStatus = EventStatus.REFUSED;
    }
    try {
      if (weeklyGroupedId) {
        await getRepository(Event).update(
          {
            id: Not(LessThan(+request.params.eventId)),
            status: EventStatus.CONFIRMED,
            weeklyGroupedId: weeklyGroupedId,
          },
          {
            status: newStatus,
            tsDeleted: new Date(),
            deletedById: response.locals.jwt.userId,
          }
        );
        return response.sendStatus(204);
      }
      await getRepository(Event).update(
        {
          id: +request.params.eventId,
          status: EventStatus.CONFIRMED,
        },
        {
          status: newStatus,
          tsDeleted: new Date(),
          deletedById: response.locals.jwt.userId,
        }
      );

      if (response.locals.jwt.userRole === UserRole.USER) {
        const complexAdmin = await getRepository(User).findOne({
          where: { complexId: event.location.complex.id },
        });
        await NotificationService.createEventNotification(
          complexAdmin.id,
          NotificationType.EVENT_CANCELED_BY_USER_AFTER_CONFIRMATION,
          event.id,
          event.name,
          complexAdmin.pushToken
        );
      }
      if (response.locals.jwt.userRole === UserRole.COMPNAY) {
        const creator = await getRepository(User).findOne({
          where: { id: event.creatorId },
        });

        await NotificationService.createEventNotification(
          creator.id,
          NotificationType.EVENT_CANCELED_BY_COMPLEX_AFTER_CONFIRMATION,
          event.id,
          event.name,
          creator.pushToken
        );
      }

      return response.status(HttpStatusCode.OK).send(new SuccessResponse("Eventi u kancelua"));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Nuk mund te kancelohej eventi!"));
    }
  };

  static getById = async (request: Request, response: Response) => {
    try {
      const result = await EventService.getById(+request.params.eventId);
      if (Helper.isDefined(result)) {
        response.status(HttpStatusCode.OK).send(new SuccessResponse(result));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }
  };

  static patchById = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId, false);
      if (Helper.isDefined(event)) {
        const updatedTeam = await EventService.patch(request.body, event, request);
        response.status(HttpStatusCode.OK).send(new SuccessResponse(updatedTeam));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
      response.status(HttpStatusCode.OK).send();
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static patchSingleEvent = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId, true);
      if (Helper.isDefined(event)) {
        const updatedTeam = await EventService.patchSingleEvent(request.body, event, request);
        response.status(HttpStatusCode.OK).send(new SuccessResponse(updatedTeam));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
      response.status(HttpStatusCode.OK).send();
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static deleteAfterCancelation = async (request: Request, response: Response) => {
    const weeklyGroupedId = +request.query.weeklyGroupedId;
    try {
      await getRepository(Event).update(
        {
          ...(!weeklyGroupedId && { id: +request.params.eventId }),
          status: EventStatus.CANCELED,
          ...(weeklyGroupedId && { weeklyGroupedId }),
        },
        {
          status: EventStatus.DELETED_BY_USER_AFTER_CANCELATION,
          tsDeleted: new Date(),
          deletedById: response.locals.jwt.userId,
        }
      );
      return response.status(HttpStatusCode.OK).send(new SuccessResponse("Eventi u kancelua"));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Nuk mund te kancelohej eventi!"));
    }
  };
}
