import * as yargs from "yargs";
import * as yaml from "js-yaml";
import { Connection, createConnection } from "typeorm";
import dotenv = require("dotenv");
dotenv.config();
import chalk from "chalk";
import fs = require("fs-extra");
import databaseConfig = require("../ormconfig");

const argv = yargs
    .usage("Usage: npm run fixtures:load -- -n=[fixture_file]")
    .alias("n", "name")
    .describe("n", "The name of the fixture file")
    .example("npm run module:create -- -n=user", "Load user fixtures")
    .demandOption(["n"])
    .argv;

execute(argv);

async function execute(args: yargs.Arguments) {

    let connection: Connection;
    try {

        const config: any = databaseConfig;
        connection = await createConnection(config);

        const fixtureFileName: string = "" + args.name;
        const filePath = process.cwd() + `/fixtures/${fixtureFileName}.yml`;
        const file: any = yaml.safeLoad(fs.readFileSync(filePath, "utf8"));
        const items = file.fixtures;

        if (!items) {
            return;
        }

        for (const item of items) {
            const entityName = Object.keys(item)[0];
            const data = item[entityName];
            await connection.createQueryBuilder().insert().into(entityName).values(data).execute();
        }

    } catch (err) {
        console.log(chalk.black.bgRed("Error during fixture load: "));
        console.error(err);
    }

    try {
        await connection.close();
    } catch (err) {
        console.log(chalk.black.bgRed("Error during fixture load: "));
        console.error(err);
    }
}
