import {MigrationInterface, QueryRunner} from "typeorm";

export class addRoomIdToUser1675609539886 implements MigrationInterface {
    name = 'addRoomIdToUser1675609539886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` ADD `roomId` json NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `roomId`");
    }

}
