import { Brackets, getCustomRepository } from "typeorm";
import { EventStatus } from "../../event/entities/event.entity";
import { EventRepository } from "../../event/repositories/event.repository";
import { TeamUsersRepository } from "../repositories/team.users.repository";

export class StatisticsService {
  static getWins = async (ids: number[]) => {
    const eventCustomRepository = getCustomRepository(EventRepository);
    return await eventCustomRepository
      .createQueryBuilder("events")
      .select("COUNT(events.id) as wins, events.winnerTeamId as winnerId")
      .where("events.winnerTeamId IN (:...ids)", { ids })
      .andWhere(
        new Brackets((qb) => {
          qb.where("events.organiserTeamId IN (:...ids)", {
            ids,
          }).orWhere("events.receiverTeamId IN (:...ids)", {
            ids,
          });
        })
      )
      .groupBy("events.winnerTeamId")
      .getRawMany();
  };

  static getLoses = async (ids: number[]) => {
    const eventCustomRepository = getCustomRepository(EventRepository);
    return await eventCustomRepository
      .createQueryBuilder("events")
      .select("COUNT(events.id) as loses, events.loserTeamId as loserId")
      .where("events.loserTeamId IN (:...ids)", { ids })
      .andWhere(
        new Brackets((qb) => {
          qb.where("events.organiserTeamId IN (:...ids)", {
            ids,
          }).orWhere("events.receiverTeamId IN (:...ids)", {
            ids,
          });
        })
      )
      .groupBy("events.loserTeamId")
      .getRawMany();
  };

  static getDraws = async (ids: number[]) => {
    const eventCustomRepository = getCustomRepository(EventRepository);
    return await eventCustomRepository
      .createQueryBuilder("events")
      .select(
        "COUNT(events.id) as draws, events.isDraw as isDraw, events.organiserTeamId as organiser, events.receiverTeamId as receiver "
      )
      .where("events.isDraw = :isDraw", { isDraw: 1 })
      .andWhere(
        new Brackets((qb) => {
          qb.where("events.organiserTeamId IN (:...ids)", {
            ids,
          }).orWhere("events.receiverTeamId IN (:...ids)", {
            ids,
          });
        })
      )
      .groupBy("events.id")
      .getRawMany();
  };

  static getLastMatches = async (id: number) => {
    const eventCustomRepository = getCustomRepository(EventRepository);
    return await eventCustomRepository
      .createQueryBuilder("events")
      .select(
        "events.id as id, events.isDraw as isDraw, events.winnerTeamId as winnerTeamId, events.loserTeamId as loserTeamId"
      )
      .where("events.status = :status", { status: EventStatus.COMPLETED })
      .andWhere(
        new Brackets((qb) => {
          qb.where("events.organiserTeamId = :id", {
            id,
          }).orWhere("events.receiverTeamId = :id", {
            id,
          });
        })
      )
      .orderBy("events.endDate", "DESC")
      .limit(10)
      .getRawMany();
  };

  static getUserStatistics = async (id: number, sport: string) => {
    const teamUsersCustomRepository = getCustomRepository(TeamUsersRepository);
    const wins = await teamUsersCustomRepository
      .createQueryBuilder("tu")
      .innerJoin("event_teams_users", "etu", "tu.id = etu.teamUserId")
      .innerJoin(
        "events",
        "e",
        "etu.eventId = e.id and tu.teamId = e.winnerTeamId"
      )
      .select("e.id as eventId, tu.teamId as teamId")
      .where(`tu.sport = '${sport}'`)
      .andWhere(`tu.playerId = ${id}`)
      .getRawMany();

    const loses = await teamUsersCustomRepository
      .createQueryBuilder("tu")
      .innerJoin("event_teams_users", "etu", "tu.id = etu.teamUserId")
      .innerJoin(
        "events",
        "e",
        "etu.eventId = e.id and tu.teamId = e.loserTeamId"
      )
      .select("e.id as eventId, tu.teamId as teamId")
      .where(`tu.sport = '${sport}'`)
      .andWhere(`tu.playerId = ${id}`)
      .getRawMany();

    const draws = await teamUsersCustomRepository
      .createQueryBuilder("tu")
      .innerJoin("event_teams_users", "etu", "tu.id = etu.teamUserId")
      .innerJoin(
        "events",
        "e",
        "etu.eventId = e.id and (e.organiserTeamId = tu.teamId or e.receiverTeamId = tu.teamId)"
      )
      .select("e.id as eventId, tu.teamId as teamId")
      .where(`tu.sport = '${sport}'`)
      .andWhere(`tu.playerId = ${id}`)
      .andWhere("e.isDraw = 1")
      .getRawMany();

    return { wins: wins.length, loses: loses.length, draws: draws.length };
  };
}
