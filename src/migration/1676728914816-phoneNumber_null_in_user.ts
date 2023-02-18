import {MigrationInterface, QueryRunner} from "typeorm";

export class phoneNumberNullInUser1676728914816 implements MigrationInterface {
    name = 'phoneNumberNullInUser1676728914816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` CHANGE `phone_number` `phone_number` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `users` CHANGE `phone_number` `phone_number` varchar(255) NOT NULL");
    }

}
