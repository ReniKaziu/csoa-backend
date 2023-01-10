// let dotenv = require(“dotenv”);
// const fs = require(‘fs’);
// dotenv.config();

module.exports = {
  type: "mysql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  timezone: "Z",
  logging: true,
  entities: ["**/**/*.entity.js"],
  migrations: ["dist/migration/*.js"],
  subscribers: ["dist/**/*.subscriber.js"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
};
