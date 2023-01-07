import {MigrationInterface, QueryRunner} from "typeorm";

export class indexStatusInEvent1669917924326 implements MigrationInterface {
    name = 'indexStatusInEvent1669917924326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_03dcebc1ab44daa177ae9479c4` ON `events` (`status`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_03dcebc1ab44daa177ae9479c4` ON `events`");
    }

}
