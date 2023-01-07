import * as express from "express";
import { UploadMiddleware } from "../attachment/middlewares/upload.middleware";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
import { TeamController } from "./controllers/team.controller";

export class TeamRouter {
  static configRoutes = (app: express.Application) => {
    app.get("/my-teams", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      TeamController.listMyTeams,
    ]);

    app.post("/teams", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UploadMiddleware.validateFileUpload("file", ["jpg", "png", "jpeg"], 2),
      TeamController.insert,
    ]);

    app.post("/teams/:teamId/attachments", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UploadMiddleware.validateFileUpload("file", ["jpg", "png", "jpeg"], 8),
      PermissionMiddleware.checkIfTeamCreator,
      TeamController.upload,
    ]);

    app.delete("/teams/:teamId/attachments/:attachmentId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN, UserRole.USER]),
      PermissionMiddleware.checkIfTeamCreator,
      TeamController.deleteAttachmentById,
    ]);

    app.get("/teams/:teamId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkMeOrPermissionsAllowed([UserRole.USER, UserRole.ADMIN]),
      TeamController.getById,
    ]);

    app.patch("/teams/:teamId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UploadMiddleware.validateFileUpload("file", ["jpg", "png", "jpeg"], 2),
      PermissionMiddleware.checkIfTeamCreator,
      TeamController.patchById,
    ]);

    app.delete("/teams/:teamId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN, UserRole.USER]),
      PermissionMiddleware.checkIfTeamCreator,
      TeamController.deleteById,
    ]);

    app.delete("/teams/:teamId/exit", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN, UserRole.USER]),
      TeamController.exit,
    ]);
  };
}
