import { CacheParamConfig } from './model/cache-parameters';
import { PropertyKey } from './model/property-key';

/**
 * Cache params configuration registry.
 */
export class CacheParamRegistry {

    private static params = new Map<Object, Map<PropertyKey, CacheParamConfig[]>>();

    /**
     * Registers method's cache
     * @param object - target object
     * @param propertyKey - target object's property key
     * @param param - parameter configuration
     */
    static registerParam(object: Object, propertyKey: PropertyKey, param: CacheParamConfig): void {

        let objectParams = this.params.get(object);

        if (!objectParams) {
            objectParams = new Map<PropertyKey, CacheParamConfig[]>();
            this.params.set(object, objectParams);
        }

        let methodParams = objectParams.get(propertyKey);

        if (!methodParams) {
            methodParams = [];
            objectParams.set(propertyKey, methodParams);
        }

        methodParams.unshift(param);
    }

    /**
     * Returns all registered cache params configurations for the given target object and property key.
     * @param object - target
     * @param propertyKey - property key
     */
    static getRegisteredParams(object: Object, propertyKey: PropertyKey): CacheParamConfig[] | undefined {
        return this.params.get(object)?.get(propertyKey);
    }

}
