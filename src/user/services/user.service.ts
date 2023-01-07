import { UserRepository } from "../repositories/user.repository";
import { QueryStringProcessor } from "../../common/utilities/QueryStringProcessor";
import { FileLogger, getCustomRepository, getRepository } from "typeorm";
import { UserRole } from "../utilities/UserRole";
import { Md5 } from "md5-typescript";
import { User } from "../entities/user.entity";
import { Helper } from "../../common/utilities/Helper";
import { Request, Response } from "express";
import { Code } from "../entities/codes.entity";
import { AuthenticationController } from "../../authentication/controllers/authentication.controller";
import { TeamUsersRepository } from "../../team/repositories/team.users.repository";
import { AtachmentRepository } from "../../attachment/repositories/attachment.repository";
import { Attachment } from "../../attachment/entities/attachment.entity";
import { ReviewRepository } from "../../review/repositories/review.repository";
import { StatisticsService } from "../../team/services/statistics.services";
import { UpdateUserDto } from "../dto/update-user.dto";
import { File } from "../../common/utilities/File";
import { Review } from "../../review/entities/review.entity";
import { TeamUsers } from "../../team/entities/team.users.entity";
const UUID = require("uuid/v1");

const accountSid = "ACd684d7d904d8ca841081b583bd0eb4d9";
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = "225cb1eacac6ea2abc6ad799ec9f4280";
// const authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;

const client = require("twilio")(accountSid, authToken);

export class UserService {
  static list = async (queryStringProcessor: QueryStringProcessor, filter: any) => {
    const userRepository = getCustomRepository(UserRepository);

    return await userRepository.list(queryStringProcessor, filter);
  };

  static insert = async (userPayload, request: Request, response: Response) => {
    const userRepository = getRepository(User);

    if (userPayload.phoneNumber) {
      if (userPayload.phoneNumber.slice(0, 3) === "355")
        userPayload.phoneNumber = userPayload.phoneNumber.slice(3, userPayload.phoneNumber.length);
      if (userPayload.phoneNumber[0] === "0")
        userPayload.phoneNumber = userPayload.phoneNumber.slice(1, userPayload.phoneNumber.length);
      userPayload.phoneNumber = "355" + userPayload.phoneNumber;

      const isExisting = await userRepository.findOne({
        where: { phoneNumber: userPayload.phoneNumber },
      });
      if (isExisting) throw "User with this number already exists";
    }

    if (userPayload.email) {
      const isExistingEmail = await userRepository.findOne({
        where: { email: userPayload.email },
      });
      if (isExistingEmail) throw "User with this email already exists";
    }

    // const codeRepository = getRepository(Code);

    // const now = new Date();

    // let isValidCode = await codeRepository
    //   .createQueryBuilder("c")
    //   .where("value = :code", { code: userPayload.code })
    //   .andWhere("is_used = :isUsed", { isUsed: false })
    //   .getMany();

    // const isValid = isValidCode.filter((code) => code.tsExpirationDate > now);

    // if (!isValid.length) throw "Code not valid or expired";

    const user = userRepository.create({
      ...userPayload,
      password: Md5.init(userPayload.password),
      role: userPayload.role ? userPayload.role : UserRole.USER,
    });

    const created = await userRepository.save(user);

    // await codeRepository.save({ ...isValid[0], isUsed: true });
    const reviews = [];
    for (const sport in created["sports"] as Object) {
      if (created["sports"][sport].picked) {
        const review = new Review();
        review.receiverId = created["id"];
        review.senderId = created["id"];
        review.sport = sport;
        review.value = created["sports"][sport].rating;
        console.log({ review });
        reviews.push(review);
      }
    }

    await getRepository(Review).save(reviews);

    request.body = {
      password: userPayload.password,
      ...(userPayload.phoneNumber && { phoneNumber: userPayload.phoneNumber }),
      ...(userPayload.email && { email: userPayload.email }),
    };
    await AuthenticationController.login(request, response);
  };

  static checkAvailability = async (userPayload, request: Request, response: Response) => {
    const userRepository = getRepository(User);
    const parameters = {
      email: true,
      phoneNumber: true,
    };

    if (userPayload.phoneNumber.slice(0, 3) === "355")
      userPayload.phoneNumber = userPayload.phoneNumber.slice(3, userPayload.phoneNumber.length);
    if (userPayload.phoneNumber[0] === "0")
      userPayload.phoneNumber = userPayload.phoneNumber.slice(1, userPayload.phoneNumber.length);
    userPayload.phoneNumber = "355" + userPayload.phoneNumber;

    const isExistingPhoneNumber = await userRepository.findOne({
      where: { phoneNumber: userPayload.phoneNumber },
    });
    if (isExistingPhoneNumber) parameters.phoneNumber = false;

    if (userPayload.email) {
      const isExistingEmail = await userRepository.findOne({
        where: { email: userPayload.email },
      });
      if (isExistingEmail) parameters.email = false;
    }

    return parameters;
  };

  static findOne = async (userId: number) => {
    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findById(userId);
    return user;
  };

  static getById = async (userId: number, sport: string) => {
    const userRepository = getCustomRepository(UserRepository);
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);
    const reviewRepository = getCustomRepository(ReviewRepository);

    const user = await userRepository.findById(userId);
    const stars = await reviewRepository.getStars([userId], sport);
    const statistics = await StatisticsService.getUserStatistics(user.id, sport);
    const teams = await teamUsersRepository
      .createQueryBuilder("tu")
      .leftJoinAndSelect("tu.team", "t")
      .where("tu.playerId = :userId", { userId: user.id })
      .andWhere("tu.sport = :sport", { sport })
      .getMany();

    user.sports[sport].rating = stars;
    user.sports[sport].statistics = statistics;
    user.sports[sport].teams = teams.map((teamUsers) => teamUsers.team);

    for (const type in user.sports as any) {
      if (type !== sport) {
        delete user.sports[type];
      }
    }
    return user;
  };

  static update = async (userPayload, currentUser: User) => {
    const userRepository = getCustomRepository(UserRepository);

    if (
      userPayload.newPassword &&
      userPayload.confirmPassword &&
      userPayload.newPassword === userPayload.confirmPassword
    ) {
      userPayload.password = Md5.init(userPayload.newPassword);
    }

    if (userPayload.phoneNumber && userPayload.phoneNumber.slice(0, 3) === "355")
      userPayload.phoneNumber = userPayload.phoneNumber.slice(3, userPayload.phoneNumber.length);
    if (userPayload.phoneNumber && userPayload.phoneNumber[0] === "0")
      userPayload.phoneNumber = userPayload.phoneNumber.slice(1, userPayload.phoneNumber.length);
    if (userPayload.phoneNumber) userPayload.phoneNumber = "355" + userPayload.phoneNumber;

    const isExisting = await userRepository.findOne({
      where: { phoneNumber: userPayload.phoneNumber },
    });
    if (isExisting) throw "User with this number already exists";

    const updateUserDto = new UpdateUserDto();
    updateUserDto.address = userPayload.address;
    updateUserDto.birthday = userPayload.birthday;
    updateUserDto.name = userPayload.name;
    updateUserDto.phoneNumber = userPayload.phoneNumber;
    updateUserDto.sex = userPayload.sex;
    updateUserDto.pushToken = userPayload.pushToken;

    const finalUser = userRepository.merge(currentUser, updateUserDto);
    await userRepository.save(finalUser);

    return finalUser;
  };

  static updateSport = async (sportsPayload, user: User) => {
    const userRepository = getCustomRepository(UserRepository);
    for (const sport in user.sports as any) {
      for (const key in user.sports[sport]) {
        if (user.sports[sport][key] !== sportsPayload[sport][key]) {
          user.sports[sport][key] = sportsPayload[sport][key];
          if (key === "rating") {
            const reviewRepository = getRepository(Review);
            await reviewRepository.update(
              { receiverId: user.id, senderId: user.id, sport },
              { value: sportsPayload[sport][key] }
            );
          }
          if (key === "picked") {
            if (sportsPayload[sport][key] === false) {
              await UserService.deleteReviewsAndTeams(user, sport);
            } else {
              await UserService.writeReview(user, sport, sportsPayload[sport]["rating"]);
            }
          }
        }
      }
    }
    return userRepository.save(user);
  };

  static writeReview = async (user: User, sport: string, value: number) => {
    const reviewCustomRepository = getCustomRepository(ReviewRepository);
    await reviewCustomRepository
      .createQueryBuilder("r")
      .insert()
      .values([{ sport: sport, value: +value, senderId: user.id, receiverId: user.id }])
      .execute();
  };

  static deleteReviewsAndTeams = async (user: User, sport: string) => {
    const reviewCustomRepository = getCustomRepository(ReviewRepository);
    await reviewCustomRepository
      .createQueryBuilder("r")
      .delete()
      .from(Review)
      .where("sport = :sport", { sport })
      .andWhere("senderId = :userId", { userId: user.id })
      .andWhere("receiverId = :userId", { userId: user.id })
      .execute();

    const teamUsersCustomRepository = getCustomRepository(TeamUsersRepository);
    await teamUsersCustomRepository
      .createQueryBuilder("tu")
      .delete()
      .from(TeamUsers)
      .where("sport = :sport", { sport })
      .andWhere("playerId = :userId", { userId: user.id })
      .execute();
  };

  static deleteById = async (user: User) => {
    const userRepository = getCustomRepository(UserRepository);

    await userRepository.softDelete(user.id);

    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    teamUsersRepository
      .createQueryBuilder("teamUsers")
      .delete()
      .where("userId = :userId", { userId: user.id })
      .execute();
  };

  // static deleteSport = async (user: User, sport: string) => {
  //   const userRepository = getRepository(User);

  //   let deletedSports = user.sports[sport];

  //   deletedSports.picked = false;
  //   deletedSports.rating = "";
  //   deletedSports.position = "";
  //   deletedSports.experience = "";

  //   userRepository.merge(user, deletedSports);

  //   await userRepository.save(user);

  //   const reviewCustomRepository = getCustomRepository(ReviewRepository);
  //   await reviewCustomRepository
  //     .createQueryBuilder("r")
  //     .delete()
  //     .from(Review)
  //     .where("sport = :sport", { sport })
  //     .andWhere("senderId = :userId", { userId: user.id })
  //     .andWhere("receiverId = :userId", { userId: user.id })
  //     .execute();

  //   const teamUsersCustomRepository = getCustomRepository(TeamUsersRepository);
  //   await teamUsersCustomRepository
  //     .createQueryBuilder("tu")
  //     .delete()
  //     .from(TeamUsers)
  //     .where("sport = :sport", { sport })
  //     .andWhere("playerId = :userId", { userId: user.id })
  //     .execute();
  // };

  static updatePassword = async (passwordPayload: string, currentUser: User) => {
    const userRepository = getCustomRepository(UserRepository);

    if (Helper.isDefined(passwordPayload)) {
      passwordPayload = Md5.init(passwordPayload);
    }

    const finalUser = userRepository.save({
      ...currentUser,
      password: passwordPayload,
    });
    return finalUser;
  };

  public static patchMe = async (request: Request, response: Response) => {
    const userRepository = getRepository(User);
    try {
      const isMatchingUser = await userRepository.findOneOrFail({
        where: {
          email: request.body.email,
          id: response.locals.jwt.userId,
        },
      });

      if (isMatchingUser) {
        const {
          body: { newPassword, confirmPassword },
        } = request;
        if (newPassword && confirmPassword && newPassword === confirmPassword) {
          request.body.password = Md5.init(newPassword);
        }

        const user = userRepository.merge(isMatchingUser, { ...request.body });
        await userRepository.save(user);
        return [request.body, null];
      }
      throw new Error("missmatching user");
    } catch (error) {
      return [null, error];
    }
  };

  public static async checkPhoneNumber(
    phoneNumber: string,
    successCallback: Function,
    errCallback: Function,
    codeExisting?: string
  ) {
    if (phoneNumber.slice(0, 3) === "355") phoneNumber = phoneNumber.slice(3, phoneNumber.length);
    if (phoneNumber[0] === "0") phoneNumber = phoneNumber.slice(1, phoneNumber.length);

    let code;
    if (!codeExisting) {
      code = new Code();
      const codeRepository = getRepository(Code);
      await codeRepository.save(code);
    }

    // client.messages
    //   .create({
    //     from: "18507530730",
    //     // from: '18507530730',
    //     to: "+355" + phoneNumber,
    //     body: `Verification code for your CSOA account: ${
    //       codeExisting ?? code.value
    //     }. The code is valid for 1 hour from now.`,
    //   })
    //   .then(() => successCallback(code))
    //   .catch((err) => errCallback(err))
    //   .done();
    successCallback(code);
  }

  static async insertProfilePicture(request: Request, response: Response) {
    const userRepository = getRepository(User);
    const user = await userRepository.findOneOrFail({
      where: { id: response.locals.jwt.userId },
    });

    if (request.file) user.profilePicture = request.file.filename;
    else user.profilePicture = null;

    return userRepository.save(user);
  }

  static async updateProfilePicture(request: Request, response: Response) {
    const userRepository = getRepository(User);
    const user = await userRepository.findOneOrFail({
      where: { id: request.params.userId },
    });

    File.deleteMedia(user.profilePicture);

    if (request.file) user.profilePicture = request.file.filename;
    else user.profilePicture = null;

    return userRepository.save(user);
  }

  static upload = async (request: Request, response: Response) => {
    if (request.files.length) {
      const files = [...(request.files as any)];
      const attachmentRepository = getCustomRepository(AtachmentRepository);
      return attachmentRepository
        .createQueryBuilder("attachments")
        .insert()
        .into(Attachment)
        .values(
          files.map((file) => {
            return {
              name: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              extension: file.mimetype.split("/")[1],
              sizeInBytes: file.size,
              path: file.path,
              teamId: null,
              userId: +request.params.userId,
            };
          })
        )
        .execute();
    }
  };
}
