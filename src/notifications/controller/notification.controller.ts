import { Request, Response } from "express";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { NotificationService } from "../services/notification.services";

export class NotificationController {
  static pushChatNotification = async (request: Request, response: Response) => {
    try {
      const results = await NotificationService.pushChatNotification(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not store chat notifications"));
    }
  };

  static listMyNotifications = async (request: Request, response: Response) => {
    try {
      const results = await NotificationService.listMyNotifications(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get notifications for user"));
    }
  };

  static listMyComplexNotifications = async (request: Request, response: Response) => {
    try {
      const results = await NotificationService.listMyComplexNotifications(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get notifications for user"));
    }
  };

  static updateNotification = async (request: Request, response: Response) => {
    try {
      const originalNotification = await NotificationService.findById(+request.params.id);
      if (Helper.isDefined(originalNotification)) {
        const updatedNotification = await NotificationService.updateNotification(originalNotification);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse(updatedNotification));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };
}
