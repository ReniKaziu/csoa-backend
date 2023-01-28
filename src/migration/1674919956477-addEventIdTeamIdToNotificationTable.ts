import {MigrationInterface, QueryRunner} from "typeorm";

export class addEventIdTeamIdToNotificationTable1674919956477 implements MigrationInterface {
    name = 'addEventIdTeamIdToNotificationTable1674919956477'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `notifications` ADD `teamId` int NULL");
        await queryRunner.query("ALTER TABLE `notifications` ADD `eventId` int NULL");
        await queryRunner.query("ALTER TABLE `notifications` ADD CONSTRAINT `FK_615755db1fa4a5747e6ef2f3d43` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `notifications` ADD CONSTRAINT `FK_3337493bfdc5d0fccd4bd5f51e3` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `notifications` DROP FOREIGN KEY `FK_3337493bfdc5d0fccd4bd5f51e3`");
        await queryRunner.query("ALTER TABLE `notifications` DROP FOREIGN KEY `FK_615755db1fa4a5747e6ef2f3d43`");
        await queryRunner.query("ALTER TABLE `notifications` DROP COLUMN `eventId`");
        await queryRunner.query("ALTER TABLE `notifications` DROP COLUMN `teamId`");
    }

}
