import {MigrationInterface, QueryRunner} from "typeorm";

export class changeLastSeenToString1674927218468 implements MigrationInterface {
    name = 'changeLastSeenToString1674927218468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` ADD `minAge` int NULL");
        await queryRunner.query("ALTER TABLE `events` ADD `maxAge` int NULL");
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `last_seen`");
        await queryRunner.query("ALTER TABLE `users` ADD `last_seen` varchar(255) NULL");
        await queryRunner.query("CREATE INDEX `IDX_96c448d018781c9164f181b593` ON `events` (`minAge`)");
        await queryRunner.query("CREATE INDEX `IDX_dde37b72768e94c56f5d3e46ea` ON `events` (`maxAge`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_dde37b72768e94c56f5d3e46ea` ON `events`");
        await queryRunner.query("DROP INDEX `IDX_96c448d018781c9164f181b593` ON `events`");
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `last_seen`");
        await queryRunner.query("ALTER TABLE `users` ADD `last_seen` timestamp NULL");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `maxAge`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `minAge`");
    }

}
