import * as express from "express";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
import { TeamUsersController } from "./controllers/team.users.controller";

export class TeamUsersRouter {
  static configRoutes = (app: express.Application) => {
    app.get("/team-users/teams/:teamId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      TeamUsersController.listPossiblePlayers,
    ]);

    app.post("/team-users/teams/:teamId/users/:userId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      TeamUsersController.inviteUser,
    ]);

    app.get("/team-users/teams/:teamId/invitations", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      TeamUsersController.listInvitationsForTeam,
    ]);

    app.put("/team-users/:teamUserId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      TeamUsersController.updateInvitation,
    ]);

    app.delete("/team-users/:teamUserId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN, UserRole.USER]),
      TeamUsersController.deleteById,
    ]);
  };
}
