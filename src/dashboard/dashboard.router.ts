import * as express from "express";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { DashboardController } from "./controllers/dashboard.controller";
import { UserRole } from "../user/utilities/UserRole";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";

export class DashboardRouter {
  static configRoutes = (app: express.Application) => {
    app.get("/dashboard-statistics", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN]),
      DashboardController.getStatistics,
    ]);

    app.get("/dashboard-statistics/:complexId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.COMPNAY]),
      DashboardController.getStatisticsByComplexId,
    ]);
  };
}
