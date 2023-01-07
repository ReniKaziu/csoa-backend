export const mockRequest = () => {
    const req: any = {};
    return req;
};

export const mockResponse = () => {
    const res: any = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnValue({})
    };
    return res;
};