import * as express from "express";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
import { EventController } from "./controllers/event.controller";

export class EventRouter {
  static configRoutes = (app: express.Application) => {
    app.get("/my-events", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.USER,
        UserRole.ADMIN,
      ]),
      EventController.listMyEvents,
    ]);

    app.post("/events", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.USER,
        UserRole.ADMIN,
      ]),
      EventController.insert,
    ]);

    app.get("/events", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN]),
      EventController.list,
    ]);

    app.post("/events/:id/toggle", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN]),
      EventController.toggleEvent,
    ]);

    app.get("/events/:id/players", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.ADMIN,
        UserRole.USER,
      ]),
      EventController.getPlayers,
    ]);

    app.post("/admin/events", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.ADMIN,
        UserRole.COMPNAY,
      ]),
      EventController.createAdminEvent,
    ]);

    app.patch("/v2/events/:eventId/confirm", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.COMPNAY]),
      EventController.confirm,
    ]);

    app.delete("/events/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.COMPNAY,
        UserRole.USER,
      ]),
      PermissionMiddleware.checkIfEventCreatorOrCompany,
      EventController.delete,
    ]);

    app.delete("/events/:eventId/cancel", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.COMPNAY,
        UserRole.USER,
      ]),
      PermissionMiddleware.checkIfEventCreatorOrCompany,
      EventController.cancel,
    ]);

    app.delete("/after-confirmation/events/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER]),
      PermissionMiddleware.checkIfEventCreatorOrCompany,
      EventController.deleteAfterCancelation,
    ]);

    app.get("/events/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkMeOrPermissionsAllowed([
        UserRole.USER,
        UserRole.COMPNAY,
        UserRole.ADMIN,
      ]),
      EventController.getById,
    ]);

    app.patch("/events/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.USER,
        UserRole.COMPNAY,
        UserRole.ADMIN,
      ]),
      PermissionMiddleware.checkIfEventCreatorOrCompany,
      EventController.patchById,
    ]);

    app.patch("/events/:eventId/single-event", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.USER,
        UserRole.COMPNAY,
        UserRole.ADMIN,
      ]),
      PermissionMiddleware.checkIfEventCreatorOrCompany,
      EventController.patchSingleEvent,
    ]);
  };
}
