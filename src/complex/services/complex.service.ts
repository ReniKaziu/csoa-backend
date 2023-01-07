import { Request, Response } from "express";
import { join } from "path";
const fs = require("fs");
import {
  ConnectionIsNotSetError,
  getCustomRepository,
  getRepository,
} from "typeorm";
import { Attachment } from "../../attachment/entities/attachment.entity";
import { File } from "../../common/utilities/File";
import { EventStatus } from "../../event/entities/event.entity";
import { EventRepository } from "../../event/repositories/event.repository";
import { User } from "../../user/entities/user.entity";
import { Complex } from "../entities/complex.entity";
import { Location } from "../entities/location.entity";

export class ComplexService {
  public static list() {
    const complexRepository = getRepository(Complex);
    return complexRepository
      .createQueryBuilder("c")
      .select([
        "id",
        "name",
        "phone",
        "facilities",
        "city",
        "sports",
        "longitude",
        "latitude",
        "workingHours",
        "address",
      ])
      .withDeleted()
      .getRawMany();
    // return complexRepository.find({ withDeleted: true });
  }
  public static async listForApp() {
    const complexRepository = getRepository(Complex);
    const data = await complexRepository.find({
      select: [
        "id",
        "name",
        "phone",
        "facilities",
        "city",
        "sports",
        "longitude",
        "latitude",
        "workingHours",
        "address",
        "avatar",
      ],
      relations: ["locations"],
    });
    const response = data.map((complex) => complex.toResponseForApp);
    return response;
  }
  public static listMinified() {
    const complexRepository = getRepository(Complex);
    return complexRepository
      .createQueryBuilder("c")
      .select(["c.name", "c.id"])
      .getMany();
  }
  public static create(payload) {
    const complexRepository = getRepository(Complex);

    let complex = complexRepository.create(payload as any);
    complex["facilities"] = {
      "Fushë e mbyllur": payload["Fushë e mbyllur"],
      Dushe: payload["Dushe"],
      "Kënd Lojrash": payload["Kënd Lojrash"],
      Bar: payload["Bar"],
      Parkim: payload["Parkim"],
    };

    complex["sports"] = {
      Futboll: payload.Futboll,
      Basketboll: payload.Basketboll,
      Tenis: payload.Tenis,
      Volejboll: payload.Volejboll,
    };

    if (complex["latitude"] === "") complex["latitude"] = null;
    if (complex["longitude"] === "") complex["longitude"] = null;

    complex["workingHours"] = {
      from: 15,
      to: 24,
    };

    return complexRepository.save(complex as any);
  }

  public static async update(payload) {
    const complexRepository = getRepository(Complex);

    if (JSON.stringify(payload["latitude"]) === JSON.stringify([""]))
      payload["latitude"] = null;
    if (JSON.stringify(payload["longitude"]) === JSON.stringify([""]))
      payload["longitude"] = null;

    return complexRepository.update({ id: payload.id }, payload);
  }
  public static getById(request) {
    const complexRepository = getRepository(Complex);
    return complexRepository.find({
      withDeleted: true,
      relations: ["attachments", "locations"],
      where: { id: request.params.id },
    });
  }

  static getEvents(id: number) {
    const eventRepository = getCustomRepository(EventRepository);
    return eventRepository
      .createQueryBuilder("e")
      .withDeleted()
      .select(
        "e.id, u.name, e.startDate, e.endDate, l.name as locationName, l.price, e.status, e.isUserReservation, e.isWeekly, u.role, e.deletedById, u.id as userId"
      )
      .innerJoin("locations", "l", "l.id = e.locationId")
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .innerJoin("users", "u", "u.id = e.creatorId")
      .where("c.id = :id", { id })
      .andWhere(`e.status != '${EventStatus.DRAFT}'`)
      .orderBy("e.id", "DESC")
      .limit(24 * 31)
      .getRawMany();
  }

  static getFilteredEvents(request) {
    const { body } = request;
    let userReserved = `(e.isUserReservation = 1 OR e.isUserReservation = 0)`;

    if (body.type["Nga aplikacion"] && !body.type["Nga paneli"]) {
      userReserved = `e.isUserReservation = 1`;
    }
    if (body.type["Nga paneli"] && !body.type["Nga aplikacion"]) {
      userReserved = `e.isUserReservation = 0`;
    }

    const selectedStatus = Object.keys(body.status).filter(
      (key) => body.status[key]
    );

    let statusCondition = `e.status IN ('${selectedStatus.join("','")}')`;

    const eventRepository = getCustomRepository(EventRepository);
    return eventRepository
      .createQueryBuilder("e")
      .withDeleted()
      .select(
        "e.id, u.name, u.phoneNumber as phoneNumber, e.startDate, e.endDate, l.name as locationName, l.price, l.id as locationId, e.sport, e.status, e.isUserReservation, e.isWeekly"
      )
      .innerJoin("locations", "l", "l.id = e.locationId")
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .innerJoin("users", "u", "u.id = e.creatorId")
      .where("c.id = :id", { id: request.params.id })
      .andWhere(statusCondition)
      .andWhere(userReserved)
      .andWhere("e.startDate >= :startDate", {
        startDate: body.time.from,
      })
      .andWhere("e.endDate <= :endDate", { endDate: body.time.to })
      .andWhere(`${body.isWeekly ? "e.isWeekly = 1" : "e.isWeekly = 0"}`)
      .orderBy("e.id", "DESC")
      .limit(24 * 62)
      .getRawMany();
  }

  static fetchEventsByLocationdId(request) {
    const eventRepository = getCustomRepository(EventRepository);
    return eventRepository
      .createQueryBuilder("e")
      .select(
        `e.id, e.name as name, e.startDate, e.endDate,l.id as locationId, l.name as locationName, 
        l.price, e.status, c.workingHours, e.sport, e.notes, e.isWeekly,
        e.weeklyGroupedId, u.name as organiser, u.email as email, u.phoneNumber as phoneNumber, e.organiserPhone `
      )
      .innerJoin("locations", "l", "l.id = e.locationId")
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .leftJoin("users", "u", "u.id = e.creatorId")
      .where("c.id = :id", { id: request.params.id })
      .andWhere("e.startDate >= :startDate", {
        startDate: request.body.from,
      })
      .andWhere("e.endDate <= :endDate", { endDate: request.body.to })
      .andWhere("l.id = :locationId", { locationId: request.params.locationId })
      .andWhere("e.status != :status", {
        status: EventStatus.DRAFT,
      })
      .orderBy("e.id", "DESC")
      .getRawMany();
  }

  static async upsert(request: Request, response: Response) {
    const fields = JSON.parse(request.body.fields);

    let complex;
    const path = join(__dirname, "../../..", "public");
    if (fields.complexId) {
      const attachmentRepository = getRepository(Attachment);
      const attachments = await attachmentRepository.find({
        where: { complexId: +fields.complexId },
      });
      for (const attachment of attachments) {
        fs.unlink(path + "/" + attachment.name, async (error) => {
          if (!error) attachmentRepository.delete({ id: attachment.id });
        });
      }
      const newComplex = new Complex();
      ComplexService.getFields(newComplex, fields);
      complex = await getRepository(Complex).update(
        { id: +fields.complexId },
        { ...newComplex }
      );
    }
    if (!fields.complexId) {
      complex = new Complex();
      ComplexService.getFields(complex, fields);
      complex = await getRepository(Complex).save(complex);
      await getRepository(User).update(
        { id: +response.locals.jwt.userId },
        { complexId: complex.id }
      );
    }

    if (request.files) {
      let attachments: Attachment[] = [];
      for (const file of request.files as Express.Multer.File[]) {
        attachments.push(
          ComplexService.createAttachmentForComplex(
            file,
            complex.id ?? +fields.complexId
          )
        );
      }
      if (attachments.length) {
        await getRepository(Attachment)
          .createQueryBuilder()
          .insert()
          .values(attachments)
          .execute();
      }
    }

    let locations: Location[] = [];
    for (const field of fields.locations) {
      const location = new Location();
      location.name = field.name;
      location.complexId = complex.id ?? fields.complexId;
      location.price = field.price;
      location.dimensions = `${field.length} x ${field.width}`;
      location.isFootball = field.isFootball;
      location.isTennis = field.isTennis;
      location.isBasketball = field.isBasketball;
      location.isVolleyball = field.isVolleyball;
      location.slotRange = field.slotRange;

      locations.push(location);
    }

    if (locations.length) {
      await getRepository(Location)
        .createQueryBuilder()
        .insert()
        .values(locations)
        .execute();
    }

    return complex.id ?? +fields.complexId;
  }

  static createAttachmentForComplex = (
    file: Express.Multer.File,
    complexId: number
  ) => {
    const attachment = new Attachment();
    attachment.name = file.filename;
    attachment.originalName = file.originalname;
    attachment.mimeType = file.mimetype;
    attachment.sizeInBytes = file.size;
    attachment.extension = File.getFileExtension(file.originalname);
    attachment.path = file.path;
    attachment.complexId = complexId;
    return attachment;
  };

  static getLocationsByComplexOwner(id: number) {
    return getRepository(Location)
      .createQueryBuilder("l")
      .select(["l.*"])
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .innerJoin("users", "u", "c.id = u.complexId")
      .where("u.id = :id", { id })
      .withDeleted()
      .getRawMany();
  }

  static getEventsByComplexOwner(id: number) {
    const eventRepository = getCustomRepository(EventRepository);
    return eventRepository
      .createQueryBuilder("e")
      .withDeleted()
      .select(
        "e.id, u.name, e.startDate, e.endDate, l.name as locationName, l.price, e.status, e.isUserReservation"
      )
      .innerJoin("locations", "l", "l.id = e.locationId")
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .innerJoin("users", "u", "u.complexId = c.id")
      .where("u.id = :id", { id })
      .andWhere(`e.status != '${EventStatus.DRAFT}'`)
      .orderBy("e.id", "DESC")
      .limit(200)
      .getRawMany();
  }

  private static getFields(complex, fields) {
    complex.name = fields.name;
    complex.phone = fields.phone;
    complex.facilities = {
      Bar: fields.Bar || false,
      Dushe: fields.Dushe || false,
      Parkim: fields.Parkim || false,
      "Kënd Lojrash": fields["Kënd Lojrash"] || false,
      "Fushë e mbyllur": fields["Fushë e mbyllur"] || false,
    };
    complex.sports = {
      Tenis: fields.Tenis || false,
      Futboll: fields.Futboll || false,
      Volejboll: fields.Volejboll || false,
      Basketboll: fields.Basketboll || false,
    };
    complex.longitude = fields.longitude ? +fields.longitude : null;
    complex.latitude = fields.latitude ? +fields.latitude : null;
    complex.banner = fields?.fileBanner?.base64;
    complex.avatar = fields?.fileAvatar?.base64;
    complex.address = fields.address;
    let from: any = new Date(fields.from);
    let hours = from.getHours();
    let minutes = from.getMinutes();
    minutes = minutes > 30 ? 1.0 : 0.0;
    hours = hours + minutes;
    from = hours;

    let to: any = new Date(fields.to);
    hours = to.getHours();
    minutes = to.getMinutes();
    minutes = minutes > 30 ? 1.0 : 0.0;
    hours = hours + minutes;
    to = hours;

    complex.workingHours = {
      from,
      to,
    };
    complex.city = fields.city;
  }
}
