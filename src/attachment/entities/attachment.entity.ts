import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Common } from "../../common/entities/common";
import { Complex } from "../../complex/entities/complex.entity";
import { Team } from "../../team/entities/team.entity";
import { User } from "../../user/entities/user.entity";

@Entity("attachments")
export class Attachment extends Common {
  @PrimaryGeneratedColumn({
    type: "int",
    name: "id",
  })
  public id: number;

  @Column("varchar", {
    nullable: false,
    length: 256,
    name: "name",
  })
  public name: string;

  @Column("varchar", {
    nullable: false,
    length: 256,
    name: "original_name",
  })
  public originalName: string;

  @Column("varchar", {
    nullable: false,
    length: 128,
    name: "mime_type",
  })
  public mimeType: string;

  @Column("varchar", {
    nullable: false,
    length: 128,
    name: "extension",
  })
  public extension: string;

  @Column("int", {
    nullable: false,
    name: "size_in_bytes",
  })
  public sizeInBytes: number;

  @Column("mediumtext", {
    nullable: true,
    name: "path",
  })
  public path: string;

  @ManyToOne(() => Team, (team) => team.attachments)
  public team: Team;
  @Column({
    type: "int",
    nullable: true,
  })
  public teamId: number;

  @ManyToOne(() => User, (user) => user.attachments)
  public user: User;
  @Column({
    type: "int",
    nullable: true,
  })
  public userId: number;

  @ManyToOne(() => Complex, (complex) => complex.attachments)
  public complex: Complex;
  @Column({
    type: "int",
    nullable: true,
  })
  public complexId: number;
}
