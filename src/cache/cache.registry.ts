import { SyncCache } from './cache';
import { CacheName } from './model/cache-name';
import { PropertyKey } from './model/property-key';

/** Cache factory function. For deferred cache instantiation */
export type CacheFactoryFunction<E = any> = () => SyncCache<E>;

/**
 * Cache definition registry.
 */
export class CacheRegistry {

    private static cacheFactoryByCacheNameMap = new Map<CacheName, CacheFactoryFunction>();
    private static cacheNamesByTargetMap = new Map<Object, CacheName[]>();

    /**
     * Registers cache factory function.
     *
     * @param target - target object
     * @param propertyKey - property key
     * @param cacheName - cache name
     * @param factory - cache factory function
     */
    static registerCacheFactory(target: Object,
                                propertyKey: PropertyKey,
                                cacheName: CacheName,
                                factory: CacheFactoryFunction): void {

        this.cacheFactoryByCacheNameMap.set(cacheName, factory);
        this.cacheNamesByTargetMap.set(target, (this.cacheNamesByTargetMap.get(target) || []).concat([cacheName]));
    }

    /**
     * Retrieves registered cache factory function by cache name if any.
     * @param cacheName - cache name
     */
    static getCacheFactory(cacheName: CacheName): CacheFactoryFunction | null {
        return this.cacheFactoryByCacheNameMap.get(cacheName) || null;
    }

    /**
     * Retrieves a list of cache names with registered factory functions for the target object.
     * @param target - target object
     */
    static getRegisteredCacheNamesByTarget(target: Object): CacheName[] {
        return this.cacheNamesByTargetMap.get(target) || [];
    }

}
