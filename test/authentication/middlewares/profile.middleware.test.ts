import { mockResponse, mockRequest } from "../../mocks/req.res.mock";
import { ProfileMiddleware } from "../../../src/authentication/middlewares/profile.middleware";
import { ERROR_MESSAGES } from "../../../src/common/utilities/ErrorMessages";

describe('Test Profile Middleware', () => {
    
    test('registerInput to validate request body', async () => {

        const reqMock = mockRequest();

        reqMock['body'] = {
            name: 'fake',
            surname: 'test',
            email: 'invalid',
            password: '12345678',
        };

        const resMock = mockResponse();

        const next = jest.fn();

        await ProfileMiddleware.validateRegisterInput(reqMock, resMock, next);
        
        expect(resMock.status).toBeCalledWith(400);
        expect(resMock.send).toHaveBeenCalledWith(expect.objectContaining({
            message: ERROR_MESSAGES.VALIDATION_ERROR
        }));
    });

    // Other methods are not necessary to test as they are the same
});