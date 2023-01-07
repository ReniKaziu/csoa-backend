import { Column, Entity, OneToMany } from "typeorm";
import { Attachment } from "../../attachment/entities/attachment.entity";
import { Common } from "../../common/entities/common";
import { Notification } from "../../notifications/entities/notification.entity";
import { User } from "../../user/entities/user.entity";
import { Location } from "./location.entity";

@Entity("complexes")
export class Complex extends Common {
  @Column("varchar", {
    nullable: true,
    name: "name",
  })
  public name: string;

  @Column("varchar", {
    nullable: true,
    name: "phone",
  })
  public phone: string;

  @Column("json", {
    nullable: true,
    name: "facilities",
  })
  public facilities: string;

  @Column("json", {
    nullable: true,
    name: "sports",
  })
  public sports: string;

  @Column("longtext", {
    nullable: true,
    name: "banner",
  })
  public banner: string;

  @Column("longtext", {
    nullable: true,
    name: "avatar",
  })
  public avatar: string;

  @OneToMany(() => Location, (location) => location.complex)
  locations: Location[];

  @OneToMany(() => Notification, (notification) => notification.complex)
  notifications: Notification[];

  @Column("varchar", {
    nullable: true,
  })
  public city: string;

  @Column("varchar", {
    nullable: true,
  })
  public address: string;

  @Column("json", {
    nullable: true,
  })
  public workingHours: string;

  @Column("decimal", {
    nullable: true,
    name: "longitude",
    scale: 7,
    precision: 10,
  })
  public longitude: number;

  @Column("decimal", {
    nullable: true,
    name: "latitude",
    scale: 7,
    precision: 10,
  })
  public latitude: number;

  @OneToMany(() => User, (user) => user.complex)
  users: User[];

  @OneToMany(() => Attachment, (attachment) => attachment.complex)
  attachments: Attachment[];

  get baseComplex() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      facilities: this.facilities,
      banner: this.banner,
      avatar: this.avatar,
    };
  }

  get toResponse() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      city: this.city,
      address: this.address,
      sports: this.sports,
      longitude: this.longitude,
      latitude: this.latitude,
      workingHours: this.workingHours,
      facilities: this.facilities,
      avatar: this.avatar,
    };
  }
  get toResponseForApp() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      city: this.city,
      address: this.address,
      sports: this.sports,
      longitude: this.longitude,
      latitude: this.latitude,
      workingHours: this.workingHours,
      facilities: this.facilities,
      avatar: this.avatar,
      locations: this.locations.map((location) => location.baseLocation),
    };
  }
}
