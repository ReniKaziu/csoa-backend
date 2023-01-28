import {MigrationInterface, QueryRunner} from "typeorm";

export class addSentReadIds1674771448208 implements MigrationInterface {
    name = 'addSentReadIds1674771448208'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `notifications` ADD `sent_ids` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `notifications` ADD `read_ids` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `notifications` DROP COLUMN `read_ids`");
        await queryRunner.query("ALTER TABLE `notifications` DROP COLUMN `sent_ids`");
    }

}
