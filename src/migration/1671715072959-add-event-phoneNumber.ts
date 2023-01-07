import {MigrationInterface, QueryRunner} from "typeorm";

export class addEventPhoneNumber1671715072959 implements MigrationInterface {
    name = 'addEventPhoneNumber1671715072959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` ADD `phoneNumber` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `phoneNumber`");
    }

}
