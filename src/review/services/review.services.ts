import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { Event } from "../../event/entities/event.entity";
import { EventTeamUsersRepository } from "../../event/repositories/event.team.users.repository";
import { ReviewRepository } from "../repositories/review.repository";

export class ReviewService {
  static listOppositeTeamPlayers = async (
    event: Event,
    request: Request,
    response: Response
  ) => {
    const eventTeamUsersRepository = getCustomRepository(
      EventTeamUsersRepository
    );
    const userId = response.locals.jwt.userId;

    const oppositeTeamPlayers = await eventTeamUsersRepository
      .createQueryBuilder("eventTeamUser")
      .leftJoinAndSelect(
        "eventTeamUser.teamUser",
        "teamUser",
        "teamUser.id = eventTeamUser.teamUserId"
      )
      .leftJoinAndSelect("teamUser.player", "user")
      .where(
        `teamUser.teamId NOT IN (select teamUser.teamId from event_teams_users eventTeamUser join teams_users teamUser on teamUser.id = eventTeamUser.teamUserId
        where eventTeamUser.eventId = ${event.id} and teamUser.playerId = ${userId})`
      )
      .getMany();

    return oppositeTeamPlayers;
  };

  static storeReviews = async (
    event: Event,
    request: Request,
    response: Response
  ) => {
    const reviewRepository = getCustomRepository(ReviewRepository);
    const senderId = response.locals.jwt.userId;
    for (const user in request.body) {
      try {
        await reviewRepository
          .createQueryBuilder("review")
          .insert()
          .values({
            senderId,
            receiverId: +user,
            value: request.body[user],
            sport: event.sport,
          })
          .execute();
      } catch (err) {
        console.log(err);
        await reviewRepository
          .createQueryBuilder("review")
          .update()
          .where("senderId = :senderId", { senderId })
          .andWhere("receiverId = :receiverId", { receiverId: +user })
          .andWhere("sport = :sport", { sport: event.sport })
          .set({ value: request.body[user] })
          .execute();
      }
    }
    return "Reviews succesfully created!";
  };
}
