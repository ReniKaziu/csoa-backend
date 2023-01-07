import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Attachment } from "../../attachment/entities/attachment.entity";
import { Common } from "../../common/entities/common";
import { Event } from "../../event/entities/event.entity";
import { Request } from "../../request/entities/request.entity";
import { User } from "../../user/entities/user.entity";
import { TeamUsers } from "./team.users.entity";

@Entity("teams")
export class Team extends Common {
  @Column("varchar", { nullable: true, name: "banner" })
  public banner: string;

  @Column("varchar", { nullable: true, name: "avatar" })
  public avatar: string;

  @Column("varchar", { nullable: true, name: "name" })
  public name: string;

  @Column("varchar", { nullable: true, name: "sport" })
  public sport: string;

  @Column("varchar", { nullable: true, name: "ageRange" })
  public ageRange: string;

  @Column("varchar", { nullable: true, name: "level" })
  public level: string;

  @Column("int", { nullable: true, name: "year" })
  public year: string;

  @Column("tinyint", { nullable: true, name: "isDummy", default: false })
  public isDummy: boolean;

  @ManyToOne(() => User, (user) => user.teams)
  public user: User;
  @Column("int", { nullable: true })
  userId: number;

  @OneToMany(() => TeamUsers, (teamUsers) => teamUsers.team)
  players: TeamUsers[];

  @OneToMany(() => Event, (event) => event.organiserTeam)
  eventOrganiser: Event[];

  @OneToMany(() => Event, (event) => event.receiverTeam)
  eventReceiver: Event[];

  @OneToMany(() => Event, (event) => event.winnerTeam)
  eventWinner: Event[];

  @OneToMany(() => Event, (event) => event.loserTeam)
  eventLoser: Event[];

  @OneToMany(() => Request, (request) => request.senderTeam)
  sentRequests: Request[];

  @OneToMany(() => Request, (request) => request.receiverTeam)
  receivedRequests: Request[];

  @OneToMany(() => Attachment, (attachment) => attachment.team)
  attachments: Attachment[];

  get toResponseObject() {
    return {
      id: this.id,
      name: this.name,
      banner: this.banner ? this.banner.split("/").pop() : "",
      avatar: this.avatar ? this.avatar.split("/").pop() : "",
      sport: this.sport,
      ageRange: this.ageRange,
      level: this.level,
      creatorId: this.userId,
    };
  }

  get toResponseWithPlayers() {
    return {
      ...this.toResponseObject,
      players: this.players.map((player) => player.player.toResponseObject()),
    };
  }
}
