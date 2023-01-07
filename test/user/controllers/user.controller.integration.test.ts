import { Connection, Repository } from "typeorm";
import * as request from 'supertest';
import app = require('../../utilities/app');
import { createTestDatabaseConnection, closeTestDatabase } from "../../utilities/database";
import { User } from "../../../src/user/entities/user.entity";
import { getLoginCredentials, Credentials, logout } from "../../utilities/credential";

describe('Test User Controller', () => {

    let userRepo: Repository<User>;

    let credentials: Credentials;

    let connection: Connection;

    beforeAll(async () => {

        try{

            // Connect to the database
            connection = await createTestDatabaseConnection();


            // Login
            credentials = await getLoginCredentials();

            // Instantiate repository
            userRepo = connection.getRepository(User);


        }catch(error) {
            throw new Error(error);
        };
    });

    afterAll(async () => {
        
        try{
    
            // Logout
            if(credentials){
                await logout(credentials);
            }

            // Disconnect
            await closeTestDatabase(connection);

        }catch(error){
            throw new Error(error);
        }
    });

    test('get /users get users list', async () => {
        
        const response = await request(app)
        .get('/users')
        .set({ Authorization: credentials.accessToken})
        .expect(200);

        expect(response.body.data.page).toBeDefined();
        expect(response.body.data.total).toBeDefined();
    });

    test('post /users create a user', async () => {
        
        await userRepo.delete({email: 'test2@test.com'});

        const payload = {
            name: 'test2',
            surname: 'test2',
            email: 'test2@test.com',
            password: '2112211221'
        }

        const response = await request(app)
        .post('/users')
        .set({ Authorization: credentials.accessToken})
        .send(payload)
        .expect(201);

        expect(response.body.data.email).toBe(payload.email);

        await userRepo.delete({email: 'test2@test.com'});
    });

    test('get /users/:userId get a user', async () => {
        
        const user = await userRepo.findOne();

        const response = await request(app)
        .get('/users/' + user.id)
        .set({ Authorization: credentials.accessToken})
        .expect(200);

        expect(response.body.data.email).toBe(user.email);
    });

    test('patch /users/:userId modify a user', async () => {
        
        const user = await userRepo.findOne();
        
        const payload = {
            name: 'somenewName',
            password: '2112211221'
        }

        const response = await request(app)
        .patch('/users/' + user.id)
        .set({ Authorization: credentials.accessToken})
        .send(payload)
        .expect(200);

        expect(response.body.data.name).toBe('somenewName');

        await userRepo.save(user);
    });
});
