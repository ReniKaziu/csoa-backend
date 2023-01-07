import { Column, Entity, Index, ManyToOne } from "typeorm";
import { Common } from "../../common/entities/common";
import { User } from "../../user/entities/user.entity";

@Entity("reviews")
@Index(["sender", "receiver", "sport"], { unique: true })
export class Review extends Common {
  @Column("decimal", {
    nullable: true,
    precision: 3,
    scale: 2,
  })
  public value: number;

  @ManyToOne(() => User, (user) => user.givenReviews)
  public sender: User;

  @ManyToOne(() => User, (user) => user.receivedReviews)
  public receiver: User;

  @Column("int", {
    nullable: true,
  })
  senderId: number;

  @Column("int", {
    nullable: true,
  })
  receiverId: number;

  @Column("varchar", { nullable: true })
  sport: string;
}
