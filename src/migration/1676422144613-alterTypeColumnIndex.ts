import {MigrationInterface, QueryRunner} from "typeorm";

export class alterTypeColumnIndex1676422144613 implements MigrationInterface {
    name = 'alterTypeColumnIndex1676422144613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_aef1c7aef3725068e5540f8f00` ON `notifications` (`type`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_aef1c7aef3725068e5540f8f00` ON `notifications`");
    }

}
