import * as express from "express";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "../user/utilities/UserRole";
// import { ProfileMiddleware } from "./middlewares/profile.middleware";
import { AuthenticationController } from "./controllers/authentication.controller";
import { ProfileController } from "./controllers/profile.controller";
import { AuthenticationMiddleware } from "./middlewares/authentication.middleware";
// import { UserMiddleware } from "../user/middlewares/user.middleware";

export class AuthenticationRouter {
  static configRoutes = (app: express.Application) => {
    app.post("/login", [AuthenticationController.login]);
    //     app.post("/refresh-token", [
    //       AuthenticationMiddleware.validateRefreshTokenInput,
    //       AuthenticationController.refreshToken,
    //     ]);

    //     app.post("/logout", [
    //       AuthenticationMiddleware.checkJwtToken,
    //       AuthenticationController.logout,
    //     ]);

    //     app.post("/register", [
    //       ProfileMiddleware.validateRegisterInput,
    //       UserMiddleware.checkUserExistance("email", "body.email", false),
    //       ProfileController.register,
    //     ]);

    //     app.post("/profile/verify", [
    //       ProfileMiddleware.validateVerifyInput,
    //       ProfileController.verfiy,
    //     ]);

    app.post("/profile/forgot-password", [ProfileController.forgotPassword]);

    app.post("/profile/change-password", [ProfileController.changePassword]);

    //     app.get("/profile/me", [
    //       AuthenticationMiddleware.checkJwtToken,
    //       ProfileController.me,
    //     ]);
  };
}
