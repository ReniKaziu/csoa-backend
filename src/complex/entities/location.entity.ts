import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Common } from "../../common/entities/common";
import { Event } from "../../event/entities/event.entity";
import { Complex } from "./complex.entity";

@Entity("locations")
export class Location extends Common {
  @Column("varchar", { nullable: true, name: "name" })
  public name: string;

  @Column("varchar", { nullable: true, name: "dimensions" })
  public dimensions: string;

  @Column("varchar", { nullable: true, name: "price" })
  public price: string;

  @ManyToOne(() => Complex, (complex) => complex.locations)
  public complex: Complex;
  @Column("int", { nullable: true })
  complexId: number;

  @OneToMany(() => Event, (event) => event.location)
  events: Location[];

  @Column("tinyint", { nullable: true, name: "isFootball" })
  public isFootball: boolean;

  @Column("tinyint", { nullable: true, name: "isBasketball" })
  public isBasketball: boolean;

  @Column("tinyint", { nullable: true, name: "isTennis" })
  public isTennis: boolean;

  @Column("tinyint", { nullable: true, name: "isVolleyball" })
  public isVolleyball: boolean;

  @Column("int", { nullable: true })
  public slotRange: number;

  get baseLocation() {
    return {
      name: this.name,
      dimensions: this.dimensions,
      price: this.price,
      slotRange: this.slotRange,
      isFootball: this.isFootball,
      isBasketball: this.isBasketball,
      isTennis: this.isTennis,
      isVolleyball: this.isVolleyball,
    };
  }

  get toResponse() {
    return {
      ...this.baseLocation,
      complex: this.complex?.toResponse,
    };
  }
}
