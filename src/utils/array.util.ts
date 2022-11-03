export class ArrayUtil {

    /** Checks if array is empty */
    static isEmpty(value?: any[]): boolean {
        return !value || value.length === 0;
    }

    /** Checks if array is not empty */
    static isNotEmpty(value?: any[]): boolean {
        return !this.isEmpty(value);
    }

    /** Converts value or array to array of values */
    static toArray<T>(value: T | Array<T>): Array<T> {
        return value ? (Array.isArray(value) ? value : [value]) : [];
    }

}
