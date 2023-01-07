import {MigrationInterface, QueryRunner} from "typeorm";

export class organiserPhoneInEvents1672336988593 implements MigrationInterface {
    name = 'organiserPhoneInEvents1672336988593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` ADD `organiserPhone` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `organiserPhone`");
    }

}
