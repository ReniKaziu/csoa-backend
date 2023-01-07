import * as express from "express";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
import { NotificationController } from "./controller/notification.controller";

export class NotificationRouter {
  static configRoutes = (app: express.Application) => {
    app.post("/chat-notifications", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      NotificationController.pushChatNotification,
    ]);

    app.get("/notifications", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      NotificationController.listMyNotifications,
    ]);

    app.get("/notifications/complexes/:complexId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.COMPNAY, UserRole.ADMIN]),
      NotificationController.listMyComplexNotifications,
    ]);

    app.put("/notifications/:id", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      NotificationController.updateNotification,
    ]);
  };
}
