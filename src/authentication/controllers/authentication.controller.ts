import { Response, Request } from "express";
import { getRepository, getCustomRepository } from "typeorm";
import * as jwt from "jsonwebtoken";
import { User } from "../../user/entities/user.entity";
import { Md5 } from "md5-typescript";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { RefreshTokenRepository } from "../repositories/refresh.token.repository";
import { UpdateUserDto } from "../../user/dto/update-user.dto";

export class AuthenticationController {
  static login = async (req: Request, res: Response) => {
    let { email, password, phoneNumber, pushToken } = req.body;
    const userRepository = getRepository(User);

    if (phoneNumber) {
      if (phoneNumber.slice(0, 3) === "355")
        phoneNumber = phoneNumber.slice(3, phoneNumber.length);
      if (phoneNumber[0] === "0")
        phoneNumber = phoneNumber.slice(1, phoneNumber.length);
      phoneNumber = "355" + phoneNumber;
    }

    let user = await userRepository.findOne({
      where: {
        ...(phoneNumber && { phoneNumber: phoneNumber }),
        ...(email && { email: email }),
        password: Md5.init(password),
      },
    });

    if (user) {
      const accessToken = jwt.sign(
        { userId: user.id, userRole: user.role },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: process.env.ACCESS_TOKEN_LIFETIME_MS,
        }
      );

      if (pushToken && pushToken !== user.pushToken) {
        const dto = new UpdateUserDto();
        dto.pushToken = pushToken;
        userRepository.merge(user, dto);
        await userRepository.save(user);
      }

      const responseData = {
        user,
        accessToken: accessToken,
      };

      return res.status(200).send(new SuccessResponse(responseData));
    } else {
      return res
        .status(400)
        .send(new ErrorResponse(ERROR_MESSAGES.INVALID_USERNAME_PASSWORD));
    }
  };

  static refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.body.refresh_token;

    const refreshTokenRepository = getCustomRepository(RefreshTokenRepository);

    const result = await refreshTokenRepository.findRefreshToken(refreshToken);

    if (result) {
      const accessToken = jwt.sign(
        {
          userId: result.users_id,
          username: result.users_username,
          userRole: result.users_role,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.ACCESS_TOKEN_LIFETIME_MS }
      );

      refreshTokenRepository.update(result.refresh_token_id, {
        access_token: accessToken,
      });

      res.status(200).send(
        new SuccessResponse({
          accessToken: accessToken,
        })
      );
    } else {
      res.status(401).send(new ErrorResponse(ERROR_MESSAGES.NOT_AUTHORIZED));
    }
  };

  static logout = async (req: Request, res: Response) => {
    const accessToken = req.header("Authorization");

    const refreshTokenRepository = getCustomRepository(RefreshTokenRepository);

    refreshTokenRepository.deleteByAccessToken(accessToken);

    res.status(200).send();
  };

  static test(request, response) {}
}
