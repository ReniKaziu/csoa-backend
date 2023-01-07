import {MigrationInterface, QueryRunner} from "typeorm";

export class makeTsDeletedIndex1669227993869 implements MigrationInterface {
    name = 'makeTsDeletedIndex1669227993869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_aeead4e4e762313594529fcc42` ON `requests` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_e5d2b096a217a982e59eccd9c5` ON `event_teams_users` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_fd8a823534d3df6345477d16c6` ON `teams_users` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_c760898cf2dd2def534c7acd59` ON `teams` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_bfede7bb28e57f2c31dbd80e9d` ON `locations` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_f336f363bb8fc1b253dba383ce` ON `events` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_89790086fbc0aa80d8cf577285` ON `events` (`startDate`)");
        await queryRunner.query("CREATE INDEX `IDX_5becab0222f106ceb3a05fd674` ON `events` (`endDate`)");
        await queryRunner.query("CREATE INDEX `IDX_5d300a384ccf10ff5a5783dcd9` ON `reviews` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_69339ecb69244f31cf56243eba` ON `users` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_4ab265b821cfb5c075db47eb80` ON `notifications` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_dced87315d0f8f07f561848fcf` ON `complexes` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_aaad03f428442e33423358b609` ON `attachments` (`ts_deleted`)");
        await queryRunner.query("CREATE INDEX `IDX_a93138a31ff1c77d4c033baed9` ON `codes` (`ts_deleted`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_a93138a31ff1c77d4c033baed9` ON `codes`");
        await queryRunner.query("DROP INDEX `IDX_aaad03f428442e33423358b609` ON `attachments`");
        await queryRunner.query("DROP INDEX `IDX_dced87315d0f8f07f561848fcf` ON `complexes`");
        await queryRunner.query("DROP INDEX `IDX_4ab265b821cfb5c075db47eb80` ON `notifications`");
        await queryRunner.query("DROP INDEX `IDX_69339ecb69244f31cf56243eba` ON `users`");
        await queryRunner.query("DROP INDEX `IDX_5d300a384ccf10ff5a5783dcd9` ON `reviews`");
        await queryRunner.query("DROP INDEX `IDX_5becab0222f106ceb3a05fd674` ON `events`");
        await queryRunner.query("DROP INDEX `IDX_89790086fbc0aa80d8cf577285` ON `events`");
        await queryRunner.query("DROP INDEX `IDX_f336f363bb8fc1b253dba383ce` ON `events`");
        await queryRunner.query("DROP INDEX `IDX_bfede7bb28e57f2c31dbd80e9d` ON `locations`");
        await queryRunner.query("DROP INDEX `IDX_c760898cf2dd2def534c7acd59` ON `teams`");
        await queryRunner.query("DROP INDEX `IDX_fd8a823534d3df6345477d16c6` ON `teams_users`");
        await queryRunner.query("DROP INDEX `IDX_e5d2b096a217a982e59eccd9c5` ON `event_teams_users`");
        await queryRunner.query("DROP INDEX `IDX_aeead4e4e762313594529fcc42` ON `requests`");
    }

}
