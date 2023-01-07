import { EntityRepository } from "typeorm";
import { CommonRepository } from "../../common/repositories/common.repository";
import { Notification } from "../entities/notification.entity";

@EntityRepository(Notification)
export class NotificationRepository extends CommonRepository<Notification> {}
