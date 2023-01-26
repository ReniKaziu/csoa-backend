import {MigrationInterface, QueryRunner} from "typeorm";

export class addLastSeenToUser1674767595091 implements MigrationInterface {
    name = 'addLastSeenToUser1674767595091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` ADD `last_seen` timestamp NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `last_seen`");
    }

}
