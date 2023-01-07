import * as express from "express";
import { UserMiddleware } from "./middlewares/user.middleware";
import { UserController } from "./controllers/user.controller";
import { AuthenticationMiddleware } from "../authentication/middlewares/authentication.middleware";
import { PermissionMiddleware } from "../common/middlewares/permission.middleware";
import { UserRole } from "./utilities/UserRole";
import { UploadMiddleware } from "../attachment/middlewares/upload.middleware";

export class UserRouter {
  static configRoutes = (app: express.Application) => {
    // inc
    app.post("/users/check-phone-number", [UserController.checkPhoneNumber]);

    app.get("/users/toggle", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN]),
      UserController.toggleUser,
    ]);

    app.get("/users", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN]),
      UserController.list,
    ]);

    app.get("/users/:userId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkMeOrPermissionsAllowed([UserRole.USER, UserRole.ADMIN]),
      UserController.getById,
    ]);

    // inc
    app.post("/register", [UserController.insert]);

    app.post("/check-availability", [UserController.checkAvailability]);

    // inc
    app.get("/cities", [UserController.getCities]);

    app.post("/user-photo", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UploadMiddleware.validateFileUpload("file", ["jpg", "png", "jpeg"], 1),
      UserController.insertProfilePicture,
    ]);

    app.patch("/users/:userId/profile-picture", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UploadMiddleware.validateFileUpload("file", ["jpg", "png", "jpeg"], 1),
      UserController.updateProfilePicture,
    ]);

    app.put("/users/:userId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UserController.putById,
    ]);

    app.put("/users/:userId/sports", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UserController.putSport,
    ]);

    app.delete("/users/:userId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UserController.deleteById,
    ]);

    app.get("/users-complexes", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkMeOrPermissionsAllowed([UserRole.ADMIN]),
      UserController.listBusinessAccounts,
    ]);

    app.post("/users-complexes", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkMeOrPermissionsAllowed([UserRole.ADMIN]),
      UserController.createBusinessUser,
    ]);

    // app.delete("/users/:userId/sports/:sport", [
    //   AuthenticationMiddleware.checkJwtToken,
    //   PermissionMiddleware.checkAllowedPermissions([
    //     UserRole.USER,
    //     UserRole.ADMIN,
    //   ]),
    //   UserController.deleteSport,
    // ]);

    app.patch("/me/change-me", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER]),
      UserMiddleware.validationPasswordInput,
      UserController.patchMe,
    ]);

    app.post("/users/:userId/attachments", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.USER, UserRole.ADMIN]),
      UploadMiddleware.validateFileUpload("file", ["jpg", "png", "jpeg"], 8),
      UserController.upload,
    ]);

    app.delete("/users/:userId/attachments/:attachmentId", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN, UserRole.USER]),
      UserController.deleteAttachmentById,
    ]);

    app.post("/users/:id/changePassword", [
      AuthenticationMiddleware.checkJwtToken,
      PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN]),
      UserController.changePassword,
    ]);
  };
}
