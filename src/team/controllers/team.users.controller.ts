import { Request, Response } from "express";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { UserService } from "../../user/services/user.service";
import { TeamService } from "../services/team.services";
import { TeamUsersService } from "../services/team.users.services";

export class TeamUsersController {
  static listPossiblePlayers = async (request: Request, response: Response) => {
    try {
      const team = await TeamService.findOne(+request.params.teamId);
      if (Helper.isDefined(team)) {
        const results = await TeamUsersService.listPossiblePlayers(team, request, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get possible users for team"));
    }
  };

  static inviteUser = async (request: Request, response: Response) => {
    try {
      const team = await TeamService.findOne(+request.params.teamId);
      const user = await UserService.findOne(+request.params.userId);
      const result = await TeamUsersService.inviteUser(team, user, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ result }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static listInvitationsForTeam = async (request: Request, response: Response) => {
    try {
      const team = await TeamService.findOne(+request.params.teamId);
      if (Helper.isDefined(team)) {
        const results = await TeamUsersService.listInvitationsForTeam(team, request, response);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse({ results }));
      } else {
        response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log({ err });
      return response.status(404).send(new ErrorResponse("Could not get invitations for team"));
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

  static updateInvitation = async (request: Request, response: Response) => {
    try {
      const originalInvitation = await TeamUsersService.getOne(+request.params.teamUserId);
      if (Helper.isDefined(originalInvitation)) {
        const updatedRequest = await TeamUsersService.updateInvitation(request.body, originalInvitation, request);
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
      const teamUser = await TeamUsersService.getOne(+request.params.teamUserId);
      if (Helper.isDefined(teamUser)) {
        await TeamUsersService.deleteById(teamUser);
        return response.status(HttpStatusCode.OK).send(new SuccessResponse("Successfully deleted"));
      } else {
        return response.status(HttpStatusCode.NOT_FOUND).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };
}
