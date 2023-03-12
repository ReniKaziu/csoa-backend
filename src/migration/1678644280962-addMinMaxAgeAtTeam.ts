import {MigrationInterface, QueryRunner} from "typeorm";

export class addMinMaxAgeAtTeam1678644280962 implements MigrationInterface {
    name = 'addMinMaxAgeAtTeam1678644280962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `teams` ADD `minAge` int NULL");
        await queryRunner.query("ALTER TABLE `teams` ADD `maxAge` int NULL");
        await queryRunner.query("CREATE INDEX `IDX_cb2d91decc5f3e9e1c7af65d17` ON `teams` (`minAge`)");
        await queryRunner.query("CREATE INDEX `IDX_22f630b7cb365be8f9b505251c` ON `teams` (`maxAge`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_22f630b7cb365be8f9b505251c` ON `teams`");
        await queryRunner.query("DROP INDEX `IDX_cb2d91decc5f3e9e1c7af65d17` ON `teams`");
        await queryRunner.query("ALTER TABLE `teams` DROP COLUMN `maxAge`");
        await queryRunner.query("ALTER TABLE `teams` DROP COLUMN `minAge`");
    }

}
