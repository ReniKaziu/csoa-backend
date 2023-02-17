import {MigrationInterface, QueryRunner} from "typeorm";

export class cronJobsColumns1676494051520 implements MigrationInterface {
    name = 'cronJobsColumns1676494051520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_f17d31bac1c1ba294ea396993c` ON `events`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `isSent`");
        await queryRunner.query("ALTER TABLE `events` ADD `completedCronSent` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `events` ADD `twoHoursBeforeCronSent` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("CREATE INDEX `IDX_069c33190d0ebcfdba8c429e41` ON `events` (`completedCronSent`)");
        await queryRunner.query("CREATE INDEX `IDX_4683661f747346b071d90fa968` ON `events` (`twoHoursBeforeCronSent`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_4683661f747346b071d90fa968` ON `events`");
        await queryRunner.query("DROP INDEX `IDX_069c33190d0ebcfdba8c429e41` ON `events`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `twoHoursBeforeCronSent`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `completedCronSent`");
        await queryRunner.query("ALTER TABLE `events` ADD `isSent` tinyint NOT NULL DEFAULT '0'");
        await queryRunner.query("CREATE INDEX `IDX_f17d31bac1c1ba294ea396993c` ON `events` (`isSent`)");
    }

}
