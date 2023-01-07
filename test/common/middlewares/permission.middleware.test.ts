import { UserRole } from "../../../src/user/utilities/UserRole";
import { PermissionMiddleware } from "../../../src/common/middlewares/permission.middleware";
import { mockResponse, mockRequest } from "../../mocks/req.res.mock";

describe('Test Permission Middleware', () => {
    
    test('checkAllowedPermissions to pass or deny access', async () => {

        const reqMock = mockRequest();

        const resMock: any = {
            status: jest.fn().mockReturnValue({}),
            locals: {
                jwt: {
                    userRole: UserRole.ADMIN
                }
            }
        }

        const next = jest.fn();

        await PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN, UserRole.USER])(reqMock, resMock, next);
        
        expect(next).toBeCalled();

        let responseMock = mockResponse();

        responseMock['locals'] = {
            jwt: {
                userRole: UserRole.USER
            }
        }
       
        await PermissionMiddleware.checkAllowedPermissions([UserRole.ADMIN])(reqMock, responseMock, next);

        expect(responseMock.status).toBeCalledWith(403);

    });

    test('checkMeOrPermissionsAllowed to allow by me and stop by permissions allowed', async () => {

        let reqMock = mockRequest();

        reqMock['params'] = {
            userId: 10
        };

        let resMock = mockResponse();

        resMock['locals'] = {
            jwt: {
                userId: 10,
                userRole: UserRole.USER
            }
        }

        const next = jest.fn();

        //Pass by me
        await PermissionMiddleware.checkMeOrPermissionsAllowed([UserRole.ADMIN])(reqMock, resMock, next);

        expect(next).toBeCalled();

        //Pass by role
        const newNext = jest.fn();

        resMock.locals.jwt.userId = 11;
        
        await PermissionMiddleware.checkMeOrPermissionsAllowed([UserRole.USER])(reqMock, resMock, newNext);

        expect(newNext).toBeCalled();
    });

    test('checkNotMe to detect me and not authorize', async () => {

        let reqMock = mockRequest();

        reqMock['params'] = {
            userId: 10
        };

        let resMock = mockResponse();

        resMock['locals'] = {
            jwt: {
                userId: 10,
            }
        }

        const next = jest.fn();

        await PermissionMiddleware.checkNotMe(reqMock, resMock, next);

        expect(resMock.status).toBeCalledWith(403);
    });
});