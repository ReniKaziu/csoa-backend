import { Request, Response } from "express";
import { getCustomRepository, getRepository } from "typeorm";
import { Attachment } from "../../attachment/entities/attachment.entity";
import { AtachmentRepository } from "../../attachment/repositories/attachment.repository";
import { UserService } from "../../user/services/user.service";
import { CreateTeamUserDto } from "../dto/create-team-user.dto";
import { CreateTeamDto } from "../dto/create-team.dto";
import { UpdateTeamDto } from "../dto/update-team.dto";
import { Team } from "../entities/team.entity";
import { TeamUsers, TeamUserStatus } from "../entities/team.users.entity";
import { TeamRepository } from "../repositories/team.repository";
import { TeamUsersRepository } from "../repositories/team.users.repository";
import { StatisticsService } from "./statistics.services";

export class TeamService {
  static listMyTeams = async (request: Request, response: Response) => {
    const teamUsersRepository = getRepository(TeamUsers);
    const user = await UserService.findOne(+response.locals.jwt.userId);
    const sportsMapped = {
      football: "Futboll",
      basketball: "Basketboll",
      tenis: "Tenis",
      voleyball: "Volejboll",
    };
    let sports = [];
    for (const sport in user.sports as any) {
      for (const key in user.sports[sport]) {
        if (key === "picked" && user.sports[sport][key] === true) {
          sports.push(sportsMapped[sport]);
        }
      }
    }

    const myTeams = await teamUsersRepository.find({
      where: {
        playerId: response.locals.jwt.userId,
        status: TeamUserStatus.CONFIRMED,
      },
      relations: ["team"],
    });

    const teamCustomRepository = getCustomRepository(TeamRepository);

    const myTeamsIds = myTeams.map((player) => player.team.id);

    const similiarTeams = await teamCustomRepository
      .createQueryBuilder("teams")
      .innerJoin("teams_users", "tu", "teams.id = tu.teamId")
      .where("tu.playerId != :id", { id: response.locals.jwt.userId })
      .andWhere("tu.teamId NOT IN (:...myTeamsIds)", { myTeamsIds: myTeamsIds.length ? myTeamsIds : [-1] })
      .andWhere("teams.sport IN (:...sports)", { sports })
      // .limit(5)
      // .offset(+request.query.page || 0 * 5)
      .getMany();

    const similiarTeamsIds = similiarTeams.map((teams) => teams.id);

    let myWins = [];
    let myLoses = [];
    let myDraws = [];
    let similiarWins = [];
    let similiarLoses = [];
    let similiarDraws = [];
    if (myTeamsIds.length) {
      myWins = await StatisticsService.getWins(myTeamsIds);
      myLoses = await StatisticsService.getLoses(myTeamsIds);
      myDraws = await StatisticsService.getDraws(myTeamsIds);
    }

    if (similiarTeamsIds.length) {
      similiarWins = await StatisticsService.getWins(similiarTeamsIds);
      similiarLoses = await StatisticsService.getLoses(similiarTeamsIds);
      similiarDraws = await StatisticsService.getDraws(similiarTeamsIds);
    }

    const myTeamsWinsMapped = {};
    if (myWins.length) {
      for (const win of myWins) {
        myTeamsWinsMapped[win.winnerId] = win;
      }
    }

    const myTeamsLosesMapped = {};
    if (myLoses.length) {
      for (const lose of myLoses) {
        myTeamsLosesMapped[lose.loserId] = lose;
      }
    }

    const myTeamsDrawsMapped = {};
    if (myDraws.length) {
      for (const draw of myDraws) {
        if (!myTeamsDrawsMapped[draw.organiser]) myTeamsDrawsMapped[draw.organiser] = 0;
        myTeamsDrawsMapped[draw.organiser] += 1;
        if (!myTeamsDrawsMapped[draw.receiver]) myTeamsDrawsMapped[draw.receiver] = 0;
        myTeamsDrawsMapped[draw.receiver] += 1;
      }
    }

    const similiarTeamsWinsMapped = {};
    if (similiarWins.length) {
      for (const win of similiarWins) {
        similiarTeamsWinsMapped[win.winnerId] = win;
      }
    }

    const similiarTeamsLosesMapped = {};
    if (similiarLoses.length) {
      for (const lose of similiarLoses) {
        similiarTeamsLosesMapped[lose.loserId] = lose;
      }
    }

    const similiarTeamsDrawsMapped = {};
    if (similiarDraws.length) {
      for (const draw of similiarDraws) {
        if (!similiarTeamsDrawsMapped[draw.organiser]) similiarTeamsDrawsMapped[draw.organiser] = 0;
        similiarTeamsDrawsMapped[draw.organiser] += 1;
        if (!similiarTeamsDrawsMapped[draw.receiver]) similiarTeamsDrawsMapped[draw.receiver] = 0;
        similiarTeamsDrawsMapped[draw.receiver] += 1;
      }
    }

    const myTeamsData = myTeams.map((team) => ({
      ...team.team.toResponseObject,
      wins: +(myTeamsWinsMapped[team.team.id]?.wins ?? 0),
      loses: +(myTeamsLosesMapped[team.team.id]?.loses ?? 0),
      draws: myTeamsDrawsMapped[team.team.id] ?? 0,
    }));

    const similiarTeamsData = similiarTeams.map((similiarTeam) => ({
      ...similiarTeam.toResponseObject,
      wins: +(similiarTeamsWinsMapped[similiarTeam.id]?.wins ?? 0),
      loses: +(similiarTeamsLosesMapped[similiarTeam.id]?.loses ?? 0),
      draws: similiarTeamsDrawsMapped[similiarTeam.id] ?? 0,
    }));

    const responseData = {
      myTeamsData,
      similiarTeamsData,
    };

    return responseData;
  };

  static insert = async (teamPayload: CreateTeamDto, request: Request, response: Response) => {
    const teamRepository = getRepository(Team);

    const isExisting = await teamRepository.findOne({
      where: { name: teamPayload.name, sport: teamPayload.sport },
    });
    if (isExisting) throw "Team with this name already exists";

    if (request.files) {
      for (const file of request.files as Array<Express.Multer.File>) {
        if (file.originalname === teamPayload.avatarName) {
          teamPayload.avatar = file.path;
        }
        if (file.originalname === teamPayload.bannerName) {
          teamPayload.banner = file.path;
        }
      }
    }

    teamPayload.userId = response.locals.jwt.userId;
    const createdTeam = teamRepository.create(teamPayload);
    const savedTeam = await teamRepository.save(createdTeam);

    const teamUsersRepository = getRepository(TeamUsers);

    const teamUserDto = new CreateTeamUserDto();
    teamUserDto.sport = savedTeam.sport;
    teamUserDto.isConfirmed = true;
    teamUserDto.playerId = response.locals.jwt.userId;
    teamUserDto.teamId = savedTeam.id;
    teamUserDto.status = TeamUserStatus.CONFIRMED;

    const createdTeamUser = teamUsersRepository.create(teamUserDto);
    await teamUsersRepository.save(createdTeamUser);

    return savedTeam.toResponseObject;
  };

  static findOne = async (teamId: number) => {
    const teamRepository = getCustomRepository(TeamRepository);

    const team = await teamRepository.createQueryBuilder("team").where("team.id = :id", { id: teamId }).getOne();

    return team;
  };

  static getById = async (teamId: number) => {
    const teamRepository = getCustomRepository(TeamRepository);
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    const team = await teamRepository.findById(teamId);

    if (team) {
      const players = await teamUsersRepository
        .createQueryBuilder("teamUsers")
        .leftJoinAndSelect("teamUsers.player", "player")
        .where("teamId = :teamId", { teamId })
        .andWhere("status = :status", { status: TeamUserStatus.CONFIRMED })
        .getMany();

      const wins = await StatisticsService.getWins([team.id]);
      const loses = await StatisticsService.getLoses([team.id]);
      const draws = await StatisticsService.getDraws([team.id]);
      let lastMatches = await StatisticsService.getLastMatches(team.id);
      lastMatches = lastMatches.map((lastMatch) => {
        if (lastMatch.isDraw) {
          return "draw";
        }
        if (lastMatch.winnerTeamId === team.id) {
          return "win";
        }
        return "loss";
      });
      let drawsMapped = {};
      for (const draw of draws) {
        if (!drawsMapped[draw.organiser]) drawsMapped[draw.organiser] = 0;
        drawsMapped[draw.organiser] += 1;
        if (!drawsMapped[draw.receiver]) drawsMapped[draw.receiver] = 0;
        drawsMapped[draw.receiver] += 1;
      }
      team["wins"] = +(wins[0]?.wins ?? 0);
      team["loses"] = +(loses[0]?.loses ?? 0);
      team["draws"] = drawsMapped[team.id] ?? 0;
      team["lastMatches"] = lastMatches;
      team["players"] = players.map((player) => player.toResponse) as any;
      team["banner"] = team.banner ? team.banner.split("/").pop() : "";
      team["avatar"] = team.avatar ? team.avatar.split("/").pop() : "";
    }

    return team;
  };

  static update = async (teamPayload, currentTeam: Team, request: Request) => {
    const teamRepository = getRepository(Team);

    if (request.files) {
      for (const file of request.files as Array<Express.Multer.File>) {
        if (file.originalname === teamPayload.avatarName) {
          teamPayload.avatar = file.path;
        }
        if (file.originalname === teamPayload.bannerName) {
          teamPayload.banner = file.path;
        }
      }
    }
    const mergedTeam = teamRepository.merge(currentTeam, teamPayload);
    const updatedTeam = await teamRepository.save(mergedTeam);

    return updatedTeam;
  };

  static deleteById = async (team: Team) => {
    const teamRepository = getRepository(Team);

    await teamRepository.softDelete(team.id);

    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    teamUsersRepository
      .createQueryBuilder("teamUsers")
      .delete()
      .where("teamId = :teamId", { teamId: team.id })
      .execute();
  };

  static exit = async (team: Team, response: Response) => {
    const teamUsersRepository = getCustomRepository(TeamUsersRepository);

    const teamRepository = getCustomRepository(TeamRepository);
    const creator = await teamRepository
      .createQueryBuilder("team")
      .where("id = :teamId", { teamId: team.id })
      .andWhere("userId = :userId", { userId: response.locals.jwt.userId })
      .getOne();

    if (creator) throw "You are a creator! You can not remove yourself from the team";

    teamUsersRepository
      .createQueryBuilder("teamUsers")
      .delete()
      .where("teamId = :teamId", { teamId: team.id })
      .andWhere("playerId = :userId", { userId: response.locals.jwt.userId })
      .execute();
  };

  static upload = async (request: Request, response: Response) => {
    if (request.files.length) {
      const files = [...(request.files as Array<Express.Multer.File>)];
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
              teamId: +request.params.teamId,
              userId: null,
            };
          })
        )
        .execute();
    }
  };
}
