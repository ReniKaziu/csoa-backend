import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { Common } from "../../common/entities/common";
import { Team } from "../../team/entities/team.entity";
import { User } from "../../user/entities/user.entity";
import { EventTeamUsers } from "./event.team.users.entity";
import { Location } from "../../complex/entities/location.entity";
import { Request } from "../../request/entities/request.entity";
import { WeeklyEventGroup } from "./weekly.event.group.entity";

export enum EventStatus {
  DRAFT = "draft",
  WAITING_FOR_CONFIRMATION = "waiting_for_confirmation",
  DELETED_BY_USER_BEFORE_CONFIRMATION = "deleted by user before confirmation",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELED = "canceled",
  DELETED_BY_USER_AFTER_CANCELATION = "deleted by user after cancelation",
  REFUSED = "refused",
}

export enum EventLevel {
  amateur = "amateur",
  serious = "serious",
  strong = "strong",
  professional = "professional",
}

@Entity("events")
export class Event extends Common {
  @Column("varchar", { nullable: true, name: "sport" })
  public sport: string;

  @Column("varchar", { nullable: true, name: "createdYear" })
  public createdYear: string;

  @Index()
  @Column("timestamp", { nullable: true, name: "startDate" })
  public startDate: Date;

  @Index()
  @Column("timestamp", { nullable: true, name: "endDate" })
  public endDate: Date;

  @Column("tinyint", { nullable: true, name: "isDraft" })
  public isDraft: boolean;

  @Column("tinyint", { nullable: true, name: "isPublic" })
  public isPublic: boolean;

  @Column("varchar", { nullable: true, name: "name" })
  public name: string;

  @Column("tinyint", { nullable: true, name: "isTeam" })
  public isTeam: boolean;

  @Column("tinyint", {
    nullable: true,
    name: "isConfirmedByUser",
    default: false,
  })
  public isConfirmedByUser: boolean;

  @Column("varchar", { nullable: true, name: "level" })
  public level: string;

  @Column("text", { nullable: true })
  public notes: string;

  @Column("varchar", { nullable: true, name: "phoneNumber" })
  public phoneNumber: string;

  @Column("varchar", { nullable: true, name: "playersNumber" })
  public playersNumber: string;

  @Column("varchar", { nullable: true, name: "playersAge" })
  public playersAge: string;

  @Index()
  @Column("varchar", { nullable: true, name: "status" })
  public status: string;

  @Column("tinyint", { nullable: true, name: "isWeekly" })
  public isWeekly: boolean;

  @Index()
  @Column("tinyint", { nullable: true, name: "isDraw" })
  public isDraw: boolean;

  @Column("varchar", { nullable: true, name: "result" })
  public result: string;

  @Column("json", { nullable: true, name: "lineups" })
  public lineups: string;

  @Column("varchar", { nullable: true })
  public organiserPhone: string;

  @ManyToOne(() => WeeklyEventGroup, (weeklyGroup) => weeklyGroup.events)
  public weeklyGrouped: WeeklyEventGroup;
  @Column("int", { nullable: true })
  weeklyGroupedId: number;

  @ManyToOne(() => Location, (location) => location.events)
  public location: Location;
  @Column("int", { nullable: true })
  locationId: number;

  @ManyToOne(() => Team, (team) => team.eventWinner)
  public winnerTeam: Team;
  @Column("int", { nullable: true })
  winnerTeamId: number;

  @ManyToOne(() => Team, (team) => team.eventLoser)
  public loserTeam: Team;
  @Column("int", { nullable: true })
  loserTeamId: number;

  @ManyToOne(() => User, (user) => user.eventReceiverTeamCaptain)
  public receiverTeamCaptain: User;
  @Column("int", { nullable: true })
  receiverTeamCaptainId: number;

  @ManyToOne(() => User, (user) => user.eventOrganiserTeamCaptain)
  public organiserTeamCaptain: User;
  @Column("int", { nullable: true })
  organiserTeamCaptainId: number;

  @ManyToOne(() => Team, (team) => team.eventOrganiser)
  public organiserTeam: Team;
  @Column("int", { nullable: true })
  organiserTeamId: number;

  @ManyToOne(() => Team, (team) => team.eventReceiver)
  public receiverTeam: Team;
  @Column("int", { nullable: true })
  receiverTeamId: number;

  @ManyToOne(() => User, (user) => user.eventCreator)
  public creator: User;
  @Column("int", { nullable: true })
  creatorId: number;

  @ManyToOne(() => User, (user) => user.eventDeleter)
  public deletedBy: User;
  @Column("int", { nullable: true })
  deletedById: number;

  @OneToMany(() => EventTeamUsers, (eventTeamUser) => eventTeamUser.event)
  eventsTeamUser: EventTeamUsers[];

  @OneToMany(() => Request, (request) => request.event)
  eventRequests: Request[];

  @Index()
  @Column("tinyint")
  isUserReservation: boolean;

  get baseEvent() {
    return {
      id: this.id,
      name: this.name,
      sport: this.sport,
      startDate: this.startDate,
      endDate: this.endDate,
      isDraft: this.isDraft,
      isPublic: this.isPublic,
      isTeam: this.isTeam,
      level: this.level,
      playersNumber: this.playersNumber,
      playersAge: this.playersAge,
      status: this.status,
      isWeekly: this.isWeekly,
      isDraw: this.isDraw,
      result: this.result,
      lineups: this.lineups,
      isConfirmedByUser: this.isConfirmedByUser,
      phoneNumber: this.phoneNumber,
    };
  }

  get toResponse() {
    return {
      ...this.baseEvent,
      location: this.location?.toResponse,
      organiserTeam: this.organiserTeam?.toResponseObject,
      receiverTeam: this.receiverTeam?.toResponseObject,
      creatorId: this.creatorId,
    };
  }

  get toResponseWithPlayers() {
    return {
      ...this.baseEvent,
      location: this.location?.toResponse,
      organiserTeam: this.organiserTeam?.toResponseWithPlayers,
      receiverTeam: this.receiverTeam?.toResponseWithPlayers,
      creatorId: this.creatorId,
      playersConfirmed: this.eventRequests?.length,
    };
  }
}
