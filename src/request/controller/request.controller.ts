import { Request, Response } from "express";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { EventService } from "../../event/services/event.services";
import { TeamService } from "../../team/services/team.services";
import { UserService } from "../../user/services/user.service";
import { RequestService } from "../services/request.services";

export class RequestController {
  static listPossibleUsersForEvent = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      if (Helper.isDefined(event)) {
        const results = await RequestService.listPossibleUsersForEvent(event, request, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get possible users for event"));
    }
  };

  static listInvitationsForEvent = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      if (Helper.isDefined(event)) {
        const results = await RequestService.listInvitationsForEvent(event, request, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get invitations for event"));
    }
  };

  static invitePlayer = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      const user = await UserService.findOne(+request.params.userId);
      const result = await RequestService.inviteUser(event, user, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ result }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static requestToEnter = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      const creator = await UserService.findOne(event.creatorId);
      const result = await RequestService.requestToEnter(event, creator, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ result }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static updateRequest = async (request: Request, response: Response) => {
    try {
      const originalRequest = await RequestService.findById(+request.params.requestId);
      if (Helper.isDefined(originalRequest)) {
        const updatedRequest = await RequestService.updateRequest(request.body, originalRequest, request);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse(updatedRequest));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static deleteById = async (request: Request, response: Response) => {
    try {
      const invitation = await RequestService.findById(+request.params.invitationId);
      if (Helper.isDefined(invitation)) {
        await RequestService.deleteById(invitation);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse("Successfully deleted"));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static listPossibleTeamsForEvent = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      if (Helper.isDefined(event)) {
        const results = await RequestService.listPossibleTeamsForEvent(event, request, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get possible users for event"));
    }
  };

  static listTeamsInvitationsForEvent = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      if (Helper.isDefined(event)) {
        const results = await RequestService.listTeamsInvitationsForEvent(event, request, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get possible users for event"));
    }
  };

  static inviteTeam = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      const team = await TeamService.findOne(+request.params.teamId);
      const result = await RequestService.inviteTeam(event, team, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ result }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static teamRequestToEnter = async (request: Request, response: Response) => {
    try {
      const event = await EventService.findById(+request.params.eventId);
      const team = await TeamService.findOne(+request.params.teamId);
      const result = await RequestService.teamRequestToEnter(event, team, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ result }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };
}
