export class Helper {

    public static isDefined(variable) {
        return ((typeof variable !== 'undefined') && variable !== null && variable !== 'null');
    }

    public static getBusinessFieldsByRole(role: string) {
    }

    public static isoToMySqlDateTime = (dateString: Date): string => {
        if (dateString) {
            return dateString.toISOString().slice(0, 19).replace("T", " ");
        } else {
            return null;
        }
    }
}