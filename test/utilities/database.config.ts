export const testDatabseConfig = {
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "12345678",
  database: "node_test",
  synchronize: false,
  logging: false,
  entities: ["src/**/*.entity.ts"],
};
