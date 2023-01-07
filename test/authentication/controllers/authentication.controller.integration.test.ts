import { Connection } from "typeorm";
import * as request from 'supertest';
import app = require('../../utilities/app');
import { createTestDatabaseConnection, closeTestDatabase } from "../../utilities/database";

describe('Test Authentication Controller', () => {

    let credentials;

    let connection: Connection;

    beforeAll(async () => {

        try{
            // Connect to the database
            connection = await createTestDatabaseConnection();

        }catch(error) {
            throw new Error('Error with connection');
        };
    });

    afterAll(async () => {
        
        try{
            await closeTestDatabase(connection);
        }catch(error){
            throw new Error(error);
        }
    });

    test('post /login unsuccessful login', async () => {
        
        const lognInput = {
            username: 'fake@test.com', 
            password: '-1'
        }
        
        await request(app).post('/login')
        .send(lognInput)
        .expect(400);
    });

    test('post /login successful login with a@a.com/Pass123# check for different credentials', async () => {
        
        const lognInput = {
            username: 'a@a.com', 
            password: 'Pass123$'
        }
        const response = await request(app).post('/login')
        .send(lognInput)
        .expect(200);

        expect(response.body.data.user.email).toBe(lognInput.username);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();

        credentials = {
            accessToken: response.body.data.accessToken,
            refreshToken: response.body.data.refreshToken
        };
    });

    test('post /refresh-token sucessfull new access token', async () => {

        const refreshTokenInput = {
            refresh_token: credentials.refreshToken
        }
       
        const response = await request(app).post('/refresh-token')
        .send(refreshTokenInput)
        .expect(200);
        expect(response.body.data.accessToken).toBeDefined();
    });

    test('post /logout sucessfull', async () => {
       await request(app)
       .post('/logout')
       .set({Authorization: credentials.accessToken})
       .expect(200);
    });
});
