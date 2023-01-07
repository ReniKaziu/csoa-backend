import {MigrationInterface, QueryRunner} from "typeorm";

export class addIsConfirmedByUserColumn1671705780519 implements MigrationInterface {
    name = 'addIsConfirmedByUserColumn1671705780519'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` ADD `isConfirmedByUser` tinyint NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `isConfirmedByUser`");
    }

}
