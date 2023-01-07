import { Column, Entity, Index, OneToMany } from "typeorm";
import { Common } from "../../common/entities/common";
import { Event } from "./event.entity";

@Entity("weekly_event_group")
export class WeeklyEventGroup extends Common {
  @Index()
  @Column("timestamp", { nullable: true, name: "startDate" })
  public startDate: Date;

  @Index()
  @Column("timestamp", { nullable: true, name: "endDate" })
  public endDate: Date;

  @Index()
  @Column("varchar", { nullable: true, name: "status" })
  public status: string;

  @OneToMany(() => Event, (event) => event.weeklyGrouped)
  events: Event[];

  get baseEvent() {
    return {
      id: this.id,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
    };
  }

  get toResponse() {
    return { ...this.baseEvent };
  }
}
