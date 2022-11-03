import { Mapper } from '../types/function';

export class MapUtil {

    /**
     * Converts given map into array of key-value pairs
     *
     * @param map - target map
     */
    static toArray<K, V>(map: Map<K, V>): Array<{key: K, value: V}> {
        const keyValuePairs = [];
        for (const [key, value] of map.entries()) {
            keyValuePairs.push({key, value});
        }
        return keyValuePairs; 
    }

    /**
     * Converts given map into array of key-value pairs
     *
     * @param map - target map
     * @param mapper - mapping function
     */
    static toArrayMap<K, V, R>(map: Map<K, V>, mapper: Mapper<V, R>): Array<{key: K, value: R}> {
        const keyValuePairs = [];
        for (const [key, value] of map.entries()) {
            keyValuePairs.push({key, value: mapper(value)});
        }
        return keyValuePairs;
    }

}
