import {MigrationInterface, QueryRunner} from "typeorm";

export class addTeamUsersStatus1670088249887 implements MigrationInterface {
    name = 'addTeamUsersStatus1670088249887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `teams_users` ADD `status` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `teams_users` DROP COLUMN `status`");
    }

}
