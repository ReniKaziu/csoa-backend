import { Column, Entity, ManyToOne } from "typeorm";
import { Common } from "../../common/entities/common";
import { TeamUsers } from "../../team/entities/team.users.entity";
import { Event } from "./event.entity";

@Entity("event_teams_users")
export class EventTeamUsers extends Common {
  @ManyToOne(() => TeamUsers, (teamuser) => teamuser.eventsTeamUser, {
    onDelete: "CASCADE",
    nullable: true,
  })
  public teamUser: TeamUsers;
  @Column("int", {
    nullable: true,
  })
  teamUserId: number;

  @ManyToOne(() => Event, (event) => event.eventsTeamUser, {
    onDelete: "CASCADE",
    nullable: true,
  })
  public event: Event;
  @Column("int", {
    nullable: true,
  })
  eventId: number;
}
