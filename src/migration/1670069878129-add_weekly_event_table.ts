import {MigrationInterface, QueryRunner} from "typeorm";

export class addWeeklyEventTable1670069878129 implements MigrationInterface {
    name = 'addWeeklyEventTable1670069878129'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `weekly_event_group` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `startDate` timestamp NULL, `endDate` timestamp NULL, `status` varchar(255) NULL, INDEX `IDX_a65700152a59fe52d32877e7c2` (`ts_deleted`), INDEX `IDX_d28450b943813a2a1832fe3198` (`startDate`), INDEX `IDX_a505fb9c75aee9c62e93ab2fb9` (`endDate`), INDEX `IDX_2534dffcabda10bf6afb81cbb0` (`status`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `events` ADD `weeklyGroupedId` int NULL");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_e699659c07f33603ca792e49000` FOREIGN KEY (`weeklyGroupedId`) REFERENCES `weekly_event_group`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_e699659c07f33603ca792e49000`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `weeklyGroupedId`");
        await queryRunner.query("DROP INDEX `IDX_2534dffcabda10bf6afb81cbb0` ON `weekly_event_group`");
        await queryRunner.query("DROP INDEX `IDX_a505fb9c75aee9c62e93ab2fb9` ON `weekly_event_group`");
        await queryRunner.query("DROP INDEX `IDX_d28450b943813a2a1832fe3198` ON `weekly_event_group`");
        await queryRunner.query("DROP INDEX `IDX_a65700152a59fe52d32877e7c2` ON `weekly_event_group`");
        await queryRunner.query("DROP TABLE `weekly_event_group`");
    }

}
