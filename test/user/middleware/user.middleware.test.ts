import { mockResponse, mockRequest } from "../../mocks/req.res.mock";
import { UserMiddleware } from "../../../src/user/middlewares/user.middleware";
import { createConnection, Connection } from "typeorm";
import { createTestDatabaseConnection, closeTestDatabase } from "../../utilities/database";

describe('Test User Middleware', () => {

    let connection: Connection;

    beforeAll(async () => {

        try{
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

    test('checkUserExistance method returns not found when expects email in body to be as user in db', async () => {

        const reqMock = mockRequest();

        reqMock['body'] = {
            noemail: "fake"
        };

        const resMock = mockResponse();

        const next = jest.fn();

        await UserMiddleware.checkUserExistance('email', 'body.email', true)(reqMock, resMock, next);
        
        expect(resMock.status).toBeCalledWith(404);
    });

    test('checkUserExistance method go to next if userId was found in db', async () => {

        const reqMock = mockRequest();

        reqMock['params'] = {
            userId: 1
        };

        const resMock = mockResponse();

        const next = jest.fn();

        await UserMiddleware.checkUserExistance('id', 'params.userId', true)(reqMock, resMock, next);
        
        expect(next).toBeCalled();
    });
});