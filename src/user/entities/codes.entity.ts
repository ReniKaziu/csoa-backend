import { BeforeInsert, Column, Entity } from "typeorm";
import { Common } from "../../common/entities/common";

@Entity("codes")
export class Code extends Common {
  @Column("varchar", {
    name: "value",
  })
  public value: string;

  @Column("timestamp", {
    name: "ts_expiration_date",
  })
  public tsExpirationDate: Date;

  @Column("tinyint", {
    name: "is_used",
    default: false,
  })
  public isUsed: boolean;

  @BeforeInsert()
  generateData() {
    this.value = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    this.tsExpirationDate = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  }
}
