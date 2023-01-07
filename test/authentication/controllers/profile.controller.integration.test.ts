import { Connection, Repository } from "typeorm";
import * as request from "supertest";
import app = require("../../utilities/app");
import {
  createTestDatabaseConnection,
  closeTestDatabase,
} from "../../utilities/database";
import { User } from "../../../src/user/entities/user.entity";
const UUID = require("uuid/v1");

describe("Test Authentication Controller", () => {
  let userRepo: Repository<User>;

  let registeredUser: User;

  let connection: Connection;

  beforeAll(async () => {
    try {
      // Connect to the database
      connection = await createTestDatabaseConnection();
    } catch (error) {
      throw new Error(error);
    }

    // Instantiate repository
    userRepo = connection.getRepository(User);
  });

  afterAll(async () => {
    try {
      if (registeredUser) {
        await userRepo.delete({ id: registeredUser.id });
      }

      // Disconnect
      await closeTestDatabase(connection);
    } catch (error) {
      throw new Error(error);
    }
  });

  test("post /register successful registration", async () => {
    await userRepo.delete({ email: "unqueEmail@test.com" });

    const registerInput = {
      name: "uniqueName" + UUID(),
      surname: "uniqueSurname" + UUID(),
      email: "unqueEmail@test.com",
      password: "12345678",
    };

    const response = await request(app)
      .post("/register")
      .send(registerInput)
      .expect(201);

    expect(response.body.data.email).toBe(registerInput.email);

    // Check user inserted into database
    const user = await userRepo.findOne({
      where: {
        email: registerInput.email,
      },
    });

    expect(user).not.toBeNull();
    expect(user.email).toBe(registerInput.email);

    registeredUser = user;
  });

  test("post /profile/verify successful verify", async () => {
    const payload = {
      token: registeredUser.verifyToken,
    };

    await request(app).post("/profile/verify").send(payload).expect(200);

    const user = await userRepo.findOne(registeredUser.id);

    expect(user).not.toBeNull();
    expect(user.isVerified).toBe(1);
    expect(user.verifyToken).toBeNull();
    expect(user.tsVerifyTokenExpiration).toBeNull();
  });

  test("post /profile/forgot-password send forget password token by email", async () => {
    const payload = {
      email: registeredUser.email,
    };

    await request(app)
      .post("/profile/forgot-password")
      .send(payload)
      .expect(200);

    const user = await userRepo.findOne(registeredUser.id);

    expect(user).not.toBeNull();
    expect(user.modifyPasswordToken).not.toBeNull();
    expect(user.tsModifyPasswordTokenExpiration).not.toBeNull();
  });
});
