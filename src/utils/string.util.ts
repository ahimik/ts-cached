export class StringUtil {

    static isString(value: any): value is string {
        return value != null && typeof value === 'string';
    }

}
