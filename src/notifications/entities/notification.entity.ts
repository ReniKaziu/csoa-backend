import { Column, Entity, ManyToOne } from "typeorm";
import { Common } from "../../common/entities/common";
import { Complex } from "../../complex/entities/complex.entity";
import { User } from "../../user/entities/user.entity";

export enum NotificationType {
  EVENT_CONFIRMED = "event confirmed",
  EVENT_COMPLETED_RESULT = "event completed result",
  EVENT_COMPLETED_REVIEW = "event completed review",
  REQUEST_TO_EVENT = "user requested to enter event",
  TEAM_REQUEST_TO_EVENT = "team requested to enter event",
  TEAM_INVITED_TO_EVENT = "team invited to enter event",
  USER_CONFIRMED_REQUEST = "user confirmed request",
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

  @ManyToOne(() => Complex, (complex) => complex.notifications)
  public complex: Complex;
  @Column("int", {
    nullable: true,
  })
  complexId: number;

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
}
