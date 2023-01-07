import { Response, Request } from "express";
import { SuccessResponse } from "../../common/utilities/SuccessResponse";
import { ErrorResponse } from "../../common/utilities/ErrorResponse";
import { ERROR_MESSAGES } from "../../common/utilities/ErrorMessages";
import { UserService } from "../services/user.service";
import { Helper } from "../../common/utilities/Helper";
import { HttpStatusCode } from "../../common/utilities/HttpStatusCodes";
import { getCustomRepository, getRepository, Not } from "typeorm";
import { User } from "../entities/user.entity";
import { AttachmentService } from "../../attachment/services/attachment.services";
import { ReviewRepository } from "../../review/repositories/review.repository";
import { Md5 } from "md5-typescript";
import { UserRole } from "../utilities/UserRole";
import { Complex } from "../../complex/entities/complex.entity";

export class UserController {
  static list = async (request: Request, response: Response) => {
    const userRepository = getRepository(User);
    try {
      const users = await userRepository.find({
        where: {
          id: Not(response.locals.jwt.userId),
          role: UserRole.USER,
        },
        withDeleted: true,
      });

      const ids = users.map((user) => user.id);
      const reviewRepository = getCustomRepository(ReviewRepository);
      let stars = [];
      if (ids.length) {
        stars = await reviewRepository.getStars(ids);
      }

      const starsMap = {};

      for (const star of stars) {
        if (!starsMap[star.userId]) {
          starsMap[star.userId] = {};
        }
        starsMap[star.userId][star.sport] = star.stars;
      }

      const userData = users.map((user) => ({
        ...user,
        footballStars: parseFloat(starsMap[user.id]?.football ?? 0).toFixed(2),
        basketballStars: parseFloat(starsMap[user.id]?.basketball ?? 0).toFixed(
          2
        ),
        tenisStars: parseFloat(starsMap[user.id]?.tenis ?? 0).toFixed(2),
        voleyballStars: parseFloat(starsMap[user.id]?.voleyball ?? 0).toFixed(
          2
        ),
      }));
      response
        .status(HttpStatusCode.OK)
        .send(new SuccessResponse({ userData }));
    } catch (error) {
      console.log({ error });
    }
  };

  static insert = async (request: Request, response: Response) => {
    try {
      const user = await UserService.insert(request.body, request, response);
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static getById = async (request: Request, response: Response) => {
    try {
      const user = await UserService.getById(
        +request.params.userId,
        request.query.sport as string
      );
      if (Helper.isDefined(user)) {
        response.status(HttpStatusCode.OK).send(new SuccessResponse(user));
      } else {
        response
          .status(HttpStatusCode.NOT_FOUND)
          .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (error) {
      console.log(error);
      response
        .status(HttpStatusCode.NOT_FOUND)
        .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }
  };

  static putById = async (request: Request, response: Response) => {
    const user = await UserService.findOne(+request.params.userId);
    if (Helper.isDefined(user)) {
      const finalUser = await UserService.update(request.body, user);
      response
        .status(HttpStatusCode.OK)
        .send(new SuccessResponse(finalUser.toResponseObject()));
    } else {
      return response
        .status(HttpStatusCode.NOT_FOUND)
        .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }

    response.status(HttpStatusCode.OK).send();
  };

  static putSport = async (request: Request, response: Response) => {
    const user = await UserService.findOne(+request.params.userId);
    if (Helper.isDefined(user)) {
      const updatedUser = await UserService.updateSport(request.body, user);
      response.status(HttpStatusCode.OK).send(new SuccessResponse(updatedUser));
    } else {
      return response
        .status(HttpStatusCode.NOT_FOUND)
        .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }

    response.status(HttpStatusCode.OK).send();
  };

  static deleteById = async (request: Request, response: Response) => {
    try {
      const user = await UserService.findOne(+request.params.userId);
      if (Helper.isDefined(user)) {
        await UserService.deleteById(user);
        return response
          .status(HttpStatusCode.OK)
          .send(new SuccessResponse("Successfully deleted"));
      } else {
        return response
          .status(HttpStatusCode.NOT_FOUND)
          .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static listBusinessAccounts = async (
    request: Request,
    response: Response
  ) => {
    const userRepository = getRepository(User);
    const complexRepository = getRepository(Complex);
    try {
      const users = await userRepository.find({
        where: {
          role: "company",
        },
        withDeleted: true,
      });
      return response
        .status(HttpStatusCode.OK)
        .send(new SuccessResponse(users));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  // static deleteSport = async (request: Request, response: Response) => {
  //   try {
  //     const user = await UserService.findOne(+request.params.userId);
  //     if (Helper.isDefined(user)) {
  //       const sport = request.params.sport;
  //       await UserService.deleteSport(user, sport);
  //       return response
  //         .status(HttpStatusCode.OK)
  //         .send(new SuccessResponse("Successfully deleted"));
  //     } else {
  //       return response
  //         .status(HttpStatusCode.NOT_FOUND)
  //         .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     return response.status(400).send(new ErrorResponse(err));
  //   }
  // };

  static patchPassword = async (request: Request, response: Response) => {
    const user = await UserService.findOne(+request.params.userId);

    if (Helper.isDefined(user)) {
      const finalUser = await UserService.updatePassword(
        request.body.newPassword,
        user
      );
      response
        .status(HttpStatusCode.OK)
        .send(new SuccessResponse(finalUser.toResponseObject()));
    } else {
      return response
        .status(HttpStatusCode.NOT_FOUND)
        .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }

    response.status(HttpStatusCode.OK).send();
  };

  public static patchMe = async (request: Request, response: Response) => {
    const [result, error] = await UserService.patchMe(request, response);
    if (error) {
      return response
        .status(402)
        .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
    }
    return response.status(200).send(new SuccessResponse(result));
  };

  public static checkAvailability = async (request: Request, response: Response) => {
    try {
      const isAvailable = await UserService.checkAvailability(request.body, request, response);
      response.status(HttpStatusCode.OK).send(new SuccessResponse({ isAvailable }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  public static async checkPhoneNumber(request: Request, response: Response) {
    UserService.checkPhoneNumber(
      request.body.phoneNumber,
      (code) => {
        return response
          .status(200)
          .send(
            new SuccessResponse({ message: "Verification code sent", code })
          );
      },
      (err) => {
        console.log({ err });
        return response
          .status(404)
          .send(new ErrorResponse("Phone number does not exist"));
      }
    );
  }

  public static async getCities(request: Request, response: Response) {
    const cities = [
      "Bajram Curri",
      "Bajzë",
      "Ballsh",
      "Berat",
      "Bilisht",
      "Bulqizë",
      "Burrel",
      "Cërrik",
      "Çorovodë",
      "Delvinë",
      "Divjakë",
      "Durrës",
      "Elbasan",
      "Ersekë",
      "Fier",
      "Fierzë",
      "Finiq",
      "Fushë-Arrëz",
      "Fushë-Krujë",
      "Gjirokastër",
      "Gramsh",
      "Himarë",
      "Kamëz",
      "Kavajë",
      "Këlcyrë",
      "Klos",
      "Konispol",
      "Koplik",
      "Korçë",
      "Krastë",
      "Krrabë",
      "Krujë",
      "Krumë",
      "Kuçovë",
      "Kukës",
      "Kurbnesh",
      "Laç",
      "Leskovik",
      "Lezhë",
      "Libohovë",
      "Librazhd",
      "Lushnjë",
      "Maliq",
      "Mamurras",
      "Manëz",
      "Memaliaj",
      "Milot",
      "Orikum",
      "Patos",
      "Peqin",
      "Përmet",
      "Peshkopi",
      "Pogradec",
      "Poliçan",
      "Prrenjas",
      "Pukë",
      "Reps",
      "Roskovec",
      "Rrëshen",
      "Rrogozhinë",
      "Rubik",
      "Sarandë",
      "Selenicë",
      "Shëngjin",
      "Shijak",
      "Shkodër",
      "Sukth",
      "Tepelenë",
      "Tirana",
      "Ulëz",
      "Ura Vajgurore",
      "Vau i Dejës",
      "Vlorë",
      "Vorë",
    ];
    return response.status(200).send(new SuccessResponse({ cities }));
  }

  public static async insertProfilePicture(
    request: Request,
    response: Response
  ) {
    try {
      const user = await UserService.insertProfilePicture(request, response);
      return response.status(200).send(new SuccessResponse({ user }));
    } catch (err) {
      console.log({ err });
      return response
        .status(404)
        .send(new ErrorResponse("Could not update profile picture"));
    }
  }

  public static async updateProfilePicture(
    request: Request,
    response: Response
  ) {
    try {
      const user = await UserService.updateProfilePicture(request, response);
      return response.status(200).send(new SuccessResponse({ user }));
    } catch (err) {
      console.log({ err });
      return response
        .status(404)
        .send(new ErrorResponse("Could not update profile picture"));
    }
  }

  static upload = async (request: Request, response: Response) => {
    try {
      const attachments = await UserService.upload(request, response);
      response
        .status(HttpStatusCode.OK)
        .send(new SuccessResponse({ attachments }));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static deleteAttachmentById = async (
    request: Request,
    response: Response
  ) => {
    try {
      const attachment = await AttachmentService.getById(
        +request.params.attachmentId
      );
      if (Helper.isDefined(attachment)) {
        await AttachmentService.deleteById(attachment);
        return response
          .status(HttpStatusCode.OK)
          .send(new SuccessResponse("Successfully deleted"));
      } else {
        return response
          .status(HttpStatusCode.NOT_FOUND)
          .send(new ErrorResponse(ERROR_MESSAGES.RECORD_NOT_FOUND));
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  public static async toggleUser(request: Request, response: Response) {
    try {
      const userRepository = getRepository(User);
      const user = await userRepository.findOneOrFail({
        where: { id: +request.query.id },
        withDeleted: true,
      });
      if (!user.tsDeleted) await userRepository.softDelete(user.id);
      else {
        user.tsDeleted = null;
        await userRepository.save(user);
      }
      return response.status(200).send(new SuccessResponse({ user }));
    } catch (err) {
      console.log({ err });
      return response
        .status(404)
        .send(new ErrorResponse("Could not update profile picture"));
    }
  }

  static createBusinessUser = async (request: Request, response: Response) => {
    try {
      const userRepository = getRepository(User);
      let user = new User();
      user.sex = "male";
      user.sports = "{}";
      user.phoneNumber = "0";
      user.address = "no address";
      user.birthday = new Date();
      user.name = request.body.name;
      user.email = request.body.email;
      user.password = Md5.init(request.body.password);
      user.role = "company";
      user.complexId = request.body.complexId;
      await userRepository.save(user);

      response.status(HttpStatusCode.OK).send(new SuccessResponse(user));
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };

  static changePassword = async (request: Request, response: Response) => {
    try {
      await getRepository(User).update(
        { id: +request.params.id },
        { password: Md5.init(request.body.password) }
      );
      response.sendStatus(204);
    } catch (err) {
      console.log(err);
      return response.status(400).send(new ErrorResponse(err));
    }
  };
}
