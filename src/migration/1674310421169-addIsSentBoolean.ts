import {MigrationInterface, QueryRunner} from "typeorm";

export class addIsSentBoolean1674310421169 implements MigrationInterface {
    name = 'addIsSentBoolean1674310421169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` ADD `isSent` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("CREATE INDEX `IDX_f17d31bac1c1ba294ea396993c` ON `events` (`isSent`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_f17d31bac1c1ba294ea396993c` ON `events`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `isSent`");
    }

}
