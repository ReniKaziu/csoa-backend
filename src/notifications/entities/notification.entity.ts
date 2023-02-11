import { Column, Entity, ManyToOne } from "typeorm";
import { Common } from "../../common/entities/common";
import { Complex } from "../../complex/entities/complex.entity";
import { Event } from "../../event/entities/event.entity";
import { Team } from "../../team/entities/team.entity";
import { User } from "../../user/entities/user.entity";

export enum NotificationType {
  EVENT_CREATED = "event created",
  EVENT_CONFIRMED = "event confirmed",
  ORGANISER_TEAM_CAPTAION = "organiser team captain",
  RECEIVER_TEAM_CAPTAION = "receiver team captain",
  EVENT_CONFIRMED_BY_USER = "event confirmed by user",
  EVENT_REFUSED_BY_COMPLEX = "event refused by complex",
  EVENT_DELETED_BY_USER_BEFORE_CONFIRMATION = "event deleted by user before confirmation",
  EVENT_CANCELED_BY_USER_AFTER_CONFIRMATION = "event canceled by user after confirmation",
  EVENT_CANCELED_BY_COMPLEX_AFTER_CONFIRMATION = "event canceled by complex after confirmation",
  EVENT_COMPLETED_RESULT = "event completed result",
  EVENT_COMPLETED_REVIEW = "event completed review",
  REQUEST_TO_EVENT = "user requested to enter event",
  TEAM_REQUEST_TO_EVENT = "team requested to enter event",
  TEAM_REQUEST_TO_EVENT_CONFIRMED = "team request to enter event confirmed",
  TEAM_REQUEST_TO_EVENT_REFUSED = "team request to enter event refused",
  TEAM_INVITED_TO_EVENT = "team invited to enter event",
  TEAM_INVITED_TO_EVENT_CONFIRMED = "team invited to enter event confirmed",
  TEAM_CONFIRMED_INVITATION = "team confirmed invitation",
  TEAM_REFUSED_INVITATION = "team refused invitation",
  USER_CONFIRMED_INVITATION = "user confirmed invitation",
  USER_REFUSED_REQUEST = "user refused request",
  CREATOR_CONFIRMED_REQUEST = "creator confirmed request",
  CREATOR_REFUSED_REQUEST = "creator refused request",
  REQUEST_REFUSED = "request refused",
  INVITATION_TO_EVENT = "user invited to event",
  INVITATION_DELETED = "invitation deleted",
  INVITATION_TO_TEAM = "user invited to team",
  INVITATION_TO_TEAM_CONFIRMED = "user confirmed invitation to team",
  INVITATION_TO_TEAM_REFUSED = "user refused invitation to team",
  USER_EXITED_TEAM = "user exited team",
  USER_EXCLUDED_FROM_TEAM = "user excluded from team",
  CHAT_USER = "chat user",
  CHAT_EVENT = "chat event",
  CHAT_TEAM = "chat team",
}

@Entity("notifications")
export class Notification extends Common {
  @Column("tinyint", {
    nullable: true,
    name: "isRead",
    default: false,
  })
  public isRead: boolean;

  @Column("json", {
    nullable: true,
    name: "payload",
  })
  public payload: string;

  @Column("varchar", {
    nullable: true,
    name: "type",
  })
  public type: string;

  @Column("varchar", {
    nullable: true,
    name: "sent_ids",
  })
  public sentIds: string;

  @Column("varchar", {
    nullable: true,
    name: "read_ids",
  })
  public readIds: string;

  @ManyToOne(() => Complex, (complex) => complex.notifications)
  public complex: Complex;
  @Column("int", {
    nullable: true,
  })
  complexId: number;

  @ManyToOne(() => Team, (team) => team.notifications)
  public team: Team;
  @Column("int", {
    nullable: true,
  })
  teamId: number;

  @ManyToOne(() => Event, (event) => event.notifications)
  public event: Event;
  @Column("int", {
    nullable: true,
  })
  eventId: number;

  @ManyToOne(() => User, (user) => user.givenNotifications)
  public sender: User;
  @Column("int", {
    nullable: true,
  })
  senderId: number;

  @ManyToOne(() => User, (user) => user.receivedNotifications)
  public receiver: User;
  @Column("int", {
    nullable: true,
  })
  receiverId: number;

  get toResponse() {
    return {
      id: this.id,
      tsCreated: this.tsCreated,
      tsLastModified: this.tsLastModified,
      tsDeleted: this.tsDeleted,
      isRead: this.isRead,
      payload: this.payload,
      type: this.type,
      sentIds: JSON.parse(this.sentIds),
      readIds: JSON.parse(this.readIds),
      complexId: this.complexId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      eventId: this.eventId,
      teamId: this.teamId,
    };
  }
}
