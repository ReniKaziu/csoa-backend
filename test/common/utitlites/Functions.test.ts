import { Functions } from "../../../src/common/utilities/Functions";

describe('Test Utility Functions', () => {

    test('formatDate method formats a date into mysql datetime format', async () => {

        const formattedDate = Functions.formatDate('2019-01-01T10:00:00.000');
        expect(formattedDate).toBe('2019-01-01 10:00:00');
    });

    test('isNotExpired method checks a if a date is considered expired', async () => {

        const now = new Date();

        const toBeFalse = Functions.isNotExpired(now);
        expect(toBeFalse).toBe(false);
        
        //Now + 2 hours
        let nowTimestamp = now.getTime();
        nowTimestamp +=  (2 * 60 * 60 * 1000); // 2 hours in ms
        const afterTwoHours = new Date(nowTimestamp);

        const toBeTrue = Functions.isNotExpired(afterTwoHours);
        expect(toBeTrue).toBe(true);
    });

    test('getObjectPath method returns the value into an object following a path', async () => {

        const myObject = {
            lev1: {
                lev2: {
                    lev3: {
                        myKey: 'myVal'
                    }
                }
            }
        }
        const value = Functions.getObjectPath(myObject, ['lev1', 'lev2', 'lev3', 'myKey']);
        expect(value).toBe('myVal');
    });

    test('getDateAfter method returns the date from now adding days or hours or minutes', async () => {

        const nowDate = new Date();
        const hours = nowDate.getHours();
        
        const newDate = Functions.getDateAfter(2, 'h');
        expect(newDate.getHours()).toBe(hours + 2);
    });
});