import { Between, getRepository, In } from "typeorm";
import { Complex } from "../../complex/entities/complex.entity";
import { Event, EventStatus } from "../../event/entities/event.entity";
import { User } from "../../user/entities/user.entity";
import { UserRole } from "../../user/utilities/UserRole";

export class DashboardService {
  static async getStatistics() {
    const userRepository = getRepository(User);
    const complexRepository = getRepository(Complex);
    const eventStatistics = getRepository(Event);

    const userStatistics = await userRepository.count({
      where: { role: UserRole.USER },
      withDeleted: true,
    });
    const complexCount = await complexRepository.count({ withDeleted: true });

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const events = await eventStatistics.find({
      where: {
        tsCreated: Between(new Date(year, month, 1), new Date(year, month + 1, 1)),
        status: In([EventStatus.CONFIRMED, EventStatus.COMPLETED]),
      },
      withDeleted: true,
    });

    const userReservations = events.filter((event) => event.isUserReservation).length;

    return {
      userStatistics,
      complexCount,
      reservations: events.length,
      userReservations: userReservations,
      complexReservations: events.length - userReservations,
    };
  }

  static getStatisticsByComplexId(complexId: number) {
    const eventStatistics = getRepository(Event);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return eventStatistics
      .createQueryBuilder("e")
      .select(["e.id", "e.isUserReservation"])
      .innerJoin("locations", "l", "l.id = e.locationId")
      .innerJoin("complexes", "c", "c.id = l.complexId")
      .where("l.complexId = :complexId", { complexId })
      .andWhere("e.status IN (:...statuses)", { statuses: [EventStatus.CONFIRMED, EventStatus.COMPLETED] })
      .andWhere("e.startDate > :startDate", {
        startDate: new Date(year, month, 1),
      })
      .andWhere("e.endDate < :endDate", {
        endDate: new Date(year, month + 1, 1),
      })
      .getMany();
  }
}
