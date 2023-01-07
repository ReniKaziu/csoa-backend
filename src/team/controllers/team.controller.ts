import { Request, Response } from "express";
import { AttachmentService } from "../../attachment/services/attachment.services";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { TeamService } from "../services/team.services";

export class TeamController {
  static listMyTeams = async (request: Request, response: Response) => {
    try {
      const results = await TeamService.listMyTeams(request, response);
      return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get my teams list"));
    }
  };

  static insert = async (request: Request, response: Response) => {
    try {
      const teamPayload = JSON.parse(request.body.body);
      const team = await TeamService.insert(teamPayload, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ team }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static upload = async (request: Request, response: Response) => {
    try {
      const attachments = await TeamService.upload(request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ attachments }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static getById = async (request: Request, response: Response) => {
    try {
      const result = await TeamService.getById(+request.params.teamId);
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
      const team = await TeamService.getById(+request.params.teamId);

      if (Helper.isDefined(team)) {
        const teamPayload = JSON.parse(request.body.body);
        const updatedTeam = await TeamService.update(teamPayload, team, request);
        response.status(HttpStatusCode.OK).send(new SuccessResponse(updatedTeam.toResponseObject));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
      response.status(HttpStatusCode.OK).send();
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static deleteById = async (request: Request, response: Response) => {
    try {
      const team = await TeamService.getById(+request.params.teamId);
      if (Helper.isDefined(team)) {
        await TeamService.deleteById(team);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse("Successfully deleted"));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static deleteAttachmentById = async (request: Request, response: Response) => {
    try {
      const attachment = await AttachmentService.getById(+request.params.attachmentId);
      if (Helper.isDefined(attachment)) {
        await AttachmentService.deleteById(attachment);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse("Successfully deleted"));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static exit = async (request: Request, response: Response) => {
    try {
      const team = await TeamService.getById(+request.params.teamId);
      if (Helper.isDefined(team)) {
        await TeamService.exit(team, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse("Successfully exited the group"));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };
}
