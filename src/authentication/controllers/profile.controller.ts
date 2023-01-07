import { Response, Request, response } from "express";
import { getRepository, getCustomRepository } from "typeorm";
import { Md5 } from "md5-typescript";
import { Mailer } from "../../common/utilities/Mailer";
import { User } from "../../user/entities/user.entity";
import { Functions } from "../../common/utilities/Functions";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
// import { SuccessResponse } from "../../common/utilities/SuccessResponse";
// import { RefreshTokenRepository } from "../repositories/refresh.token.repository";
import { UserService } from "../../user/services/user.service";
import { UserRepository } from "../../user/repositories/user.repository";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";

const UUID = require("uuid/v1");

export class ProfileController {
  //   static register = async (req: Request, res: Response) => {
  //     const { name, surname, email, password, phoneNumber } = req.body;

  //     const newUser: User = new User();
  //     newUser.name = name;
  //     newUser.email = email;
  //     newUser.password = password;
  //     newUser.phoneNumber = phoneNumber

  //     const user = await UserService.insert(newUser);
  //     const userRepository = getCustomRepository(UserRepository);

  //     //SEND ACTIVATION MAIL
  //     let subject = "Activate Account";
  //     // let htmlBody = `Click <a href="${process.env.FRONT_END_URL}/verify/${user.verifyToken}"> to activate access to Valhalla.`;

  //     try {
  //       const mailer = new Mailer();
  //       // mailer.sendMail(user.email, subject, htmlBody);
  //       // res.status(201).send(new SuccessResponse(user.toResponseObject()));
  //     } catch (error) {
  //       // userRepository.delete({ id: user.id });

  //       const errorResponse = new ErrorResponse(ERROR_MESSAGES.EMAIL_FAILED);
  //       errorResponse.errors = [
  //         {
  //           key: "email",
  //           message: "Invalid address",
  //         },
  //       ];
  //       res.status(400).send(errorResponse);
  //     }
  //   };

  //   static verfiy = async (req: Request, res: Response) => {
  //     const verifyToken = req.body.token;

  //     const userRepository = getRepository(User);
  //     let user: User = new User();

  //     try {
  //       user = await userRepository.findOne({
  //         where: {
  //           verifyToken: verifyToken,
  //           deleted: false,
  //         },
  //       });
  //     } catch (error) {
  //       console.log(error);
  //     }

  //     if (user) {
  //       if (Functions.isNotExpired(user.tsVerifyTokenExpiration)) {
  //         user.isVerified = true;
  //         user.verifyToken = null;
  //         user.tsVerifyTokenExpiration = null;

  //         await userRepository.save(user);

  //         res.status(200).send();
  //       } else {
  //         res.status(400).send(new ErrorResponse(ERROR_MESSAGES.TOKEN_EXPIRED));
  //       }
  //     } else {
  //       res.status(400).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
  //     }
  //   };

  static forgotPassword = async (req: Request, res: Response) => {
    let { email, phoneNumber } = req.body;

    const searchField = phoneNumber ? "phoneNumber" : "email";
    let searchValue = email;

    if (phoneNumber) {
      if (phoneNumber.slice(0, 3) === "355") phoneNumber = phoneNumber.slice(3, phoneNumber.length);
      if (phoneNumber[0] === "0") phoneNumber = phoneNumber.slice(1, phoneNumber.length);
      phoneNumber = "355" + phoneNumber;
      searchValue = phoneNumber;
    }

    const userRepository = getRepository(User);

    const userExist = await userRepository.findOne({
      where: {
        [searchField]: searchValue,
      },
    });

    if (userExist) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const userUpdate = {
        modifyPasswordToken: code,
        tsModifyPasswordTokenExpiration: Functions.getDateAfter(process.env.DURATION_MODIFY_PASSWORD_TOKEN_HOURS, "h"),
      };

      const finalUser = userRepository.merge(userExist, userUpdate);

      await userRepository.save(finalUser);

      // SEND FORGOT PASSWORD EMAILL
      let subject = "Forgot Password";
      let htmlBody = `Your verification code is <strong><u>${code}</u></strong>`;

      try {
        if (email) {
          const mailer = new Mailer();
          mailer.sendMail(userExist.email, subject, htmlBody);
          return res.sendStatus(200);
        } else {
          UserService.checkPhoneNumber(
            phoneNumber,
            () => {
              return res.status(200).send(new SuccessResponse("Verification code sent"));
            },
            (err) => {
              console.log({ err });
              return res.status(404).send(new ErrorResponse("Phone number does not exist"));
            },
            code
          );
        }
      } catch (error) {
        //Rollback user
        userRepository.save(userExist);
        res.status(400).send(new ErrorResponse(ERROR_MESSAGES.EMAIL_FAILED));
      }
    } else {
      res.status(404).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }
  };

  static changePassword = async (req: Request, res: Response) => {
    const { password, token } = req.body;

    const userRepository = getRepository(User);

    let userExist = await userRepository.findOne({
      where: {
        modifyPasswordToken: token,
      },
    });

    if (userExist) {
      if (Functions.isNotExpired(userExist.tsModifyPasswordTokenExpiration)) {
        const userUpdate = {
          password: Md5.init(password),
          modifyPasswordToken: null,
          tsModifyPasswordTokenExpiration: null,
          tsLastModified: Functions.formatDate(Date.now()),
        };

        const finalUser = userRepository.merge(userExist, userUpdate);
        await userRepository.save(finalUser);

        res.status(200).send({ data: "Password updated successfully" });
      } else {
        res.status(400).send(new ErrorResponse(ERROR_MESSAGES.TOKEN_EXPIRED));
      }
    } else {
      res.status(400).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }
  };

  //   static me = async (req: Request, res: Response) => {
  //     const userRepository = getRepository(User);

  //     let userId = res.locals.jwt.userId;
  //     let userExist = await userRepository.findOne({
  //       where: {
  //         id: userId,
  //         deleted: false,
  //       },
  //     });

  //     if (userExist) {
  //       res.status(200).send(new SuccessResponse(userExist.toResponseObject()));
  //     } else {
  //       res.status(400).send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
  //     }
  //   };
}
