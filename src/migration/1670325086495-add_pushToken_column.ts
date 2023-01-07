import {MigrationInterface, QueryRunner} from "typeorm";

export class addPushTokenColumn1670325086495 implements MigrationInterface {
    name = 'addPushTokenColumn1670325086495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` ADD `pushToken` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `pushToken`");
    }

}
