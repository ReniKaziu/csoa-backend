import * as express from "express";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
import { RequestController } from "./controller/request.controller";

export class RequestRouter {
  static configRoutes = (app: express.Application) => {
    app.get("/possible-users/event/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.listPossibleUsersForEvent,
    ]);

    app.get("/invitations/event/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.listInvitationsForEvent,
    ]);

    app.post("/invitations/event/:eventId/user/:userId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.invitePlayer,
    ]);

    app.delete("/invitations/:invitationId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.deleteById,
    ]);

    app.post("/requests/event/:eventId/", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.requestToEnter,
    ]);

    app.put("/requests/:requestId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.updateRequest,
    ]);

    app.post("/team-invitations/event/:eventId/team/:teamId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.inviteTeam,
    ]);

    app.post("/team-requests/event/:eventId/team/:teamId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.teamRequestToEnter,
    ]);

    app.get("/possible-teams/event/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.listPossibleTeamsForEvent,
    ]);

    app.get("/team-invitations/event/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      RequestController.listTeamsInvitationsForEvent,
    ]);
  };
}
