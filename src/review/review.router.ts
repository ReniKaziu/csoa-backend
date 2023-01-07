import * as express from "express";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
import { ReviewController } from "./controller/review.controller";

export class ReviewRouter {
  static configRoutes = (app: express.Application) => {
    app.get("/reviews/event/:eventId/opposite-team-players", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.USER,
        UserRole.ADMIN,
      ]),
      ReviewController.listOppositeTeamPlayers,
    ]);

    app.post("/reviews/event/:eventId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([
        UserRole.USER,
        UserRole.ADMIN,
      ]),
      ReviewController.storeReviews,
    ]);
  };
}
