import {MigrationInterface, QueryRunner} from "typeorm";

export class eventDeleterInEvents1671280772241 implements MigrationInterface {
    name = 'eventDeleterInEvents1671280772241'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` ADD `deletedById` int NULL");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_a142b98be553fa6b9b5facd82b3` FOREIGN KEY (`deletedById`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_a142b98be553fa6b9b5facd82b3`");
        await queryRunner.query("ALTER TABLE `events` DROP COLUMN `deletedById`");
    }

}
