import * as request from 'supertest';
import app = require('./app');
import { User } from '../../src/user/entities/user.entity';
import { UserRole } from '../../src/user/utilities/UserRole';

export interface Credentials {
    accessToken: string;
    refreshToken: string;
}

export const getLoginCredentials = async (): Promise<Credentials> => {

    const lognInput = {
        username: 'a@a.com', 
        password: 'Pass123$'
    }

    const response = await request(app).post('/login').send(lognInput);

    if(response.body && response.body.data && response.body.data.accessToken){
        return {
            accessToken: response.body.data.accessToken,
            refreshToken: response.body.data.refreshToken
        };

    } else {
        throw new Error("Failed to login as a@a.com/Pass123$ to contiune testing")
    }
};

export const logout = async (credentials: Credentials) => {

    await request(app)
       .post('/logout')
       .set({Authorization: credentials.accessToken});
};