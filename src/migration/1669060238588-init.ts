import {MigrationInterface, QueryRunner} from "typeorm";

export class init1669060238588 implements MigrationInterface {
    name = 'init1669060238588'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `requests` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `senderId` int NULL, `receiverId` int NULL, `senderTeamId` int NULL, `receiverTeamId` int NULL, `eventId` int NULL, `sport` varchar(255) NULL, `status` varchar(255) NULL, `isRequest` tinyint NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `event_teams_users` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `teamUserId` int NULL, `eventId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `teams_users` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `sport` varchar(255) NULL, `isConfirmed` tinyint NULL, `playerId` int NULL, `teamId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `teams` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `banner` varchar(255) NULL, `avatar` varchar(255) NULL, `name` varchar(255) NULL, `sport` varchar(255) NULL, `ageRange` varchar(255) NULL, `level` varchar(255) NULL, `year` int NULL, `isDummy` tinyint NULL DEFAULT 0, `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `locations` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `name` varchar(255) NULL, `dimensions` varchar(255) NULL, `price` varchar(255) NULL, `complexId` int NULL, `isFootball` tinyint NULL, `isBasketball` tinyint NULL, `isTennis` tinyint NULL, `isVolleyball` tinyint NULL, `slotRange` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `events` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `sport` varchar(255) NULL, `createdYear` varchar(255) NULL, `startDate` timestamp NULL, `endDate` timestamp NULL, `isDraft` tinyint NULL, `isPublic` tinyint NULL, `name` varchar(255) NULL, `isTeam` tinyint NULL, `level` varchar(255) NULL, `notes` text NULL, `playersNumber` varchar(255) NULL, `playersAge` varchar(255) NULL, `status` varchar(255) NULL, `isWeekly` tinyint NULL, `isDraw` tinyint NULL, `result` varchar(255) NULL, `lineups` json NULL, `locationId` int NULL, `winnerTeamId` int NULL, `loserTeamId` int NULL, `receiverTeamCaptainId` int NULL, `organiserTeamCaptainId` int NULL, `organiserTeamId` int NULL, `receiverTeamId` int NULL, `creatorId` int NULL, `isUserReservation` tinyint NOT NULL, INDEX `IDX_a19e885f0fd2b9dd8d6d296308` (`isDraw`), INDEX `IDX_409e9d92aee704f83dacaf1cbe` (`isUserReservation`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `reviews` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `value` decimal(3,2) NULL, `senderId` int NULL, `receiverId` int NULL, `sport` varchar(255) NULL, UNIQUE INDEX `IDX_23bdc4b1edd012192314961c64` (`senderId`, `receiverId`, `sport`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `password` varchar(256) NULL, `name` varchar(256) NOT NULL, `email` varchar(256) NULL, `role` varchar(256) NULL, `profile_picture` varchar(256) NULL, `sex` varchar(256) NOT NULL, `modify_password_token` varchar(256) NULL, `ts_modify_password_token_expiration` timestamp NULL, `phone_number` varchar(255) NOT NULL, `address` varchar(255) NOT NULL, `birthday` timestamp NOT NULL, `sports` json NOT NULL, `complexId` int NULL, UNIQUE INDEX `IDX_97672ac88f789774dd47f7c8be` (`email`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `notifications` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `isRead` tinyint NULL DEFAULT 0, `payload` json NULL, `type` varchar(255) NULL, `complexId` int NULL, `senderId` int NULL, `receiverId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `complexes` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `name` varchar(255) NULL, `phone` varchar(255) NULL, `facilities` json NULL, `sports` json NULL, `banner` longtext NULL, `avatar` longtext NULL, `city` varchar(255) NULL, `address` varchar(255) NULL, `workingHours` json NULL, `longitude` decimal(10,7) NULL, `latitude` decimal(10,7) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `attachments` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `name` varchar(256) NOT NULL, `original_name` varchar(256) NOT NULL, `mime_type` varchar(128) NOT NULL, `extension` varchar(128) NOT NULL, `size_in_bytes` int NOT NULL, `path` mediumtext NULL, `teamId` int NULL, `userId` int NULL, `complexId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `refresh_token` (`id` int NOT NULL AUTO_INCREMENT, `access_token` varchar(256) NOT NULL, `refresh_token` varchar(256) NOT NULL, `ts_expiration` timestamp NOT NULL, `user_id` int NULL, UNIQUE INDEX `IDX_07ec1391b1de6e40fb0bfb07fa` (`refresh_token`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `codes` (`id` int NOT NULL AUTO_INCREMENT, `ts_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_last_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `ts_deleted` datetime(6) NULL, `value` varchar(255) NOT NULL, `ts_expiration_date` timestamp NOT NULL, `is_used` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `requests` ADD CONSTRAINT `FK_670f44ad50fac2e635f4213fa9b` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `requests` ADD CONSTRAINT `FK_df2b65da9fe84c28e82f221bcd5` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `requests` ADD CONSTRAINT `FK_2c6d077e8ea32219a6ccd4f0c0d` FOREIGN KEY (`senderTeamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `requests` ADD CONSTRAINT `FK_b1387b2e2348065319346ac1f2c` FOREIGN KEY (`receiverTeamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `requests` ADD CONSTRAINT `FK_806cde43a5ea7d964eb354ed849` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `event_teams_users` ADD CONSTRAINT `FK_e7e6e77090eb7f03c51744e07aa` FOREIGN KEY (`teamUserId`) REFERENCES `teams_users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `event_teams_users` ADD CONSTRAINT `FK_f9bfa6e1e8c7b02ad0d619b68e4` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `teams_users` ADD CONSTRAINT `FK_96c157f43165f1cb7bf7204b62d` FOREIGN KEY (`playerId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `teams_users` ADD CONSTRAINT `FK_61562c3f531008097b6cab0c513` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `teams` ADD CONSTRAINT `FK_5c5696b2c3c57698f890b2cbbdd` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `locations` ADD CONSTRAINT `FK_370127b2e8da09edf008ea0ff0e` FOREIGN KEY (`complexId`) REFERENCES `complexes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_55ad94f5c1b4c97960d6d7dc115` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_4dccd316b9c5f860651b69b9e1e` FOREIGN KEY (`winnerTeamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_aa198f4c53b08353567afdfc183` FOREIGN KEY (`loserTeamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_241c22452de3d3e01dd85aec192` FOREIGN KEY (`receiverTeamCaptainId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_c487895d96ca34e9317a4316ee7` FOREIGN KEY (`organiserTeamCaptainId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_c0c52b3c8fdbd45689e66f99726` FOREIGN KEY (`organiserTeamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_ae8396a25ec30417dd543982a67` FOREIGN KEY (`receiverTeamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `events` ADD CONSTRAINT `FK_c621508a2b84ae21d3f971cdb47` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `reviews` ADD CONSTRAINT `FK_3c888cf2a2de493dc5178cf69e1` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `reviews` ADD CONSTRAINT `FK_93452d8b6b611370eb583779c0d` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `users` ADD CONSTRAINT `FK_0d1877980ffd614b65f2e0078f9` FOREIGN KEY (`complexId`) REFERENCES `complexes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `notifications` ADD CONSTRAINT `FK_cbadd26cf1ca715c4b7785df14d` FOREIGN KEY (`complexId`) REFERENCES `complexes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `notifications` ADD CONSTRAINT `FK_ddb7981cf939fe620179bfea33a` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `notifications` ADD CONSTRAINT `FK_d1e9b2452666de3b9b4d271cca0` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `attachments` ADD CONSTRAINT `FK_7894270afcd395b0cf5da005630` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `attachments` ADD CONSTRAINT `FK_35138b11d46d53c48ed932afa47` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `attachments` ADD CONSTRAINT `FK_2465431bb045a3d100df8cd60b4` FOREIGN KEY (`complexId`) REFERENCES `complexes`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `refresh_token` ADD CONSTRAINT `FK_6bbe63d2fe75e7f0ba1710351d4` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `refresh_token` DROP FOREIGN KEY `FK_6bbe63d2fe75e7f0ba1710351d4`");
        await queryRunner.query("ALTER TABLE `attachments` DROP FOREIGN KEY `FK_2465431bb045a3d100df8cd60b4`");
        await queryRunner.query("ALTER TABLE `attachments` DROP FOREIGN KEY `FK_35138b11d46d53c48ed932afa47`");
        await queryRunner.query("ALTER TABLE `attachments` DROP FOREIGN KEY `FK_7894270afcd395b0cf5da005630`");
        await queryRunner.query("ALTER TABLE `notifications` DROP FOREIGN KEY `FK_d1e9b2452666de3b9b4d271cca0`");
        await queryRunner.query("ALTER TABLE `notifications` DROP FOREIGN KEY `FK_ddb7981cf939fe620179bfea33a`");
        await queryRunner.query("ALTER TABLE `notifications` DROP FOREIGN KEY `FK_cbadd26cf1ca715c4b7785df14d`");
        await queryRunner.query("ALTER TABLE `users` DROP FOREIGN KEY `FK_0d1877980ffd614b65f2e0078f9`");
        await queryRunner.query("ALTER TABLE `reviews` DROP FOREIGN KEY `FK_93452d8b6b611370eb583779c0d`");
        await queryRunner.query("ALTER TABLE `reviews` DROP FOREIGN KEY `FK_3c888cf2a2de493dc5178cf69e1`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_c621508a2b84ae21d3f971cdb47`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_ae8396a25ec30417dd543982a67`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_c0c52b3c8fdbd45689e66f99726`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_c487895d96ca34e9317a4316ee7`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_241c22452de3d3e01dd85aec192`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_aa198f4c53b08353567afdfc183`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_4dccd316b9c5f860651b69b9e1e`");
        await queryRunner.query("ALTER TABLE `events` DROP FOREIGN KEY `FK_55ad94f5c1b4c97960d6d7dc115`");
        await queryRunner.query("ALTER TABLE `locations` DROP FOREIGN KEY `FK_370127b2e8da09edf008ea0ff0e`");
        await queryRunner.query("ALTER TABLE `teams` DROP FOREIGN KEY `FK_5c5696b2c3c57698f890b2cbbdd`");
        await queryRunner.query("ALTER TABLE `teams_users` DROP FOREIGN KEY `FK_61562c3f531008097b6cab0c513`");
        await queryRunner.query("ALTER TABLE `teams_users` DROP FOREIGN KEY `FK_96c157f43165f1cb7bf7204b62d`");
        await queryRunner.query("ALTER TABLE `event_teams_users` DROP FOREIGN KEY `FK_f9bfa6e1e8c7b02ad0d619b68e4`");
        await queryRunner.query("ALTER TABLE `event_teams_users` DROP FOREIGN KEY `FK_e7e6e77090eb7f03c51744e07aa`");
        await queryRunner.query("ALTER TABLE `requests` DROP FOREIGN KEY `FK_806cde43a5ea7d964eb354ed849`");
        await queryRunner.query("ALTER TABLE `requests` DROP FOREIGN KEY `FK_b1387b2e2348065319346ac1f2c`");
        await queryRunner.query("ALTER TABLE `requests` DROP FOREIGN KEY `FK_2c6d077e8ea32219a6ccd4f0c0d`");
        await queryRunner.query("ALTER TABLE `requests` DROP FOREIGN KEY `FK_df2b65da9fe84c28e82f221bcd5`");
        await queryRunner.query("ALTER TABLE `requests` DROP FOREIGN KEY `FK_670f44ad50fac2e635f4213fa9b`");
        await queryRunner.query("DROP TABLE `codes`");
        await queryRunner.query("DROP INDEX `IDX_07ec1391b1de6e40fb0bfb07fa` ON `refresh_token`");
        await queryRunner.query("DROP TABLE `refresh_token`");
        await queryRunner.query("DROP TABLE `attachments`");
        await queryRunner.query("DROP TABLE `complexes`");
        await queryRunner.query("DROP TABLE `notifications`");
        await queryRunner.query("DROP INDEX `IDX_97672ac88f789774dd47f7c8be` ON `users`");
        await queryRunner.query("DROP TABLE `users`");
        await queryRunner.query("DROP INDEX `IDX_23bdc4b1edd012192314961c64` ON `reviews`");
        await queryRunner.query("DROP TABLE `reviews`");
        await queryRunner.query("DROP INDEX `IDX_409e9d92aee704f83dacaf1cbe` ON `events`");
        await queryRunner.query("DROP INDEX `IDX_a19e885f0fd2b9dd8d6d296308` ON `events`");
        await queryRunner.query("DROP TABLE `events`");
        await queryRunner.query("DROP TABLE `locations`");
        await queryRunner.query("DROP TABLE `teams`");
        await queryRunner.query("DROP TABLE `teams_users`");
        await queryRunner.query("DROP TABLE `event_teams_users`");
        await queryRunner.query("DROP TABLE `requests`");
    }

}
