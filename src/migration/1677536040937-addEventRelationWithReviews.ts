import {MigrationInterface, QueryRunner} from "typeorm";

export class addEventRelationWithReviews1677536040937 implements MigrationInterface {
    name = 'addEventRelationWithReviews1677536040937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reviews` ADD `eventId` int NULL");
        await queryRunner.query("ALTER TABLE `reviews` ADD CONSTRAINT `FK_4f7296a2fca003e6422701be16c` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reviews` DROP FOREIGN KEY `FK_4f7296a2fca003e6422701be16c`");
        await queryRunner.query("ALTER TABLE `reviews` DROP COLUMN `eventId`");
    }

}
