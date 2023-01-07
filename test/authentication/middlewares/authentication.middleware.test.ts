import { mockResponse, mockRequest } from "../../mocks/req.res.mock";
import { AuthenticationMiddleware } from "../../../src/authentication/middlewares/authentication.middleware";
import * as jwt from "jsonwebtoken";
import { UserRole } from "../../../src/user/utilities/UserRole";

describe('Test Authentication Middleware', () => {
    
    beforeEach(() => {
        jest.resetModules() // this is important - it clears the cache
        process.env = {
            JWT_SECRET_KEY: 'test'
        };
    });

    test('hasLoginValidFields to validate request body', async () => {

        const reqMock = mockRequest();

        reqMock['body'] = {
            something: "fake"
        };

        const resMock = mockResponse();

        const next = jest.fn();

        await AuthenticationMiddleware.hasLoginValidFields(reqMock, resMock, next);
        
        expect(resMock.status).toBeCalledWith(400);
    });

    test('checkJwtToken to call next on a singed token', async () => {

        let reqMock = mockRequest();

        const  accessToken = jwt.sign(
            { userId: -1, username: 'test', userRole: UserRole.USER },
            process.env.JWT_SECRET_KEY,
            { expiresIn: 100000 }
        );
        reqMock['header'] = () => accessToken;

        let resMock = mockResponse();
        resMock['locals'] = {};

        const next = jest.fn();

        await AuthenticationMiddleware.checkJwtToken(reqMock, resMock, next);
        
        expect(next).toBeCalled();
    });

    test('validateRefreshTokenInput to call next when refreshToken', async () => {

        let reqMock = mockRequest();
        reqMock.body = {
            refresh_token: 'sometoken'
        };
        const resMock = mockResponse();

        const next = jest.fn();

        await AuthenticationMiddleware.validateRefreshTokenInput(reqMock, resMock, next);
        
        expect(next).toBeCalled();
    });
});