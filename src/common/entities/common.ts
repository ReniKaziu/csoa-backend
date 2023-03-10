import { Column, PrimaryGeneratedColumn, BeforeUpdate, DeleteDateColumn, Index } from "typeorm";
import { SoftDelete } from "./soft.delete";

export abstract class Common extends SoftDelete {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
  })
  public id: number;

  @Column("timestamp", {
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
    name: "ts_created",
  })
  public tsCreated: Date;

  @Column("timestamp", {
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
    name: "ts_last_modified",
  })
  public tsLastModified: Date;

  @Index()
  @DeleteDateColumn({ name: "ts_deleted" })
  public tsDeleted: Date;

  @BeforeUpdate()
  addLastModified() {
    this.tsLastModified = new Date();
  }
}
