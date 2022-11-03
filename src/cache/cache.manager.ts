import { SyncCache } from './cache';
import { CacheRegistry } from './cache.registry';
import { CacheName } from './model/cache-name';

/**
 * Cache manager.
 * Manages caches' instances.
 */
export class CacheManager {

    private static caches = new Map<CacheName, SyncCache>();

    /**
     * Retrieves cache instance by name.
     * Automatically instantiates cache if instance is missing and cache factory function is registered within {@link CacheRegistry}.
     *
     * @param cacheName - cache name
     */
    static getCache(cacheName: CacheName): SyncCache | null {

        let cache = this.caches.get(cacheName) || null;

        if (cache == null) {
            const cacheFactory = CacheRegistry.getCacheFactory(cacheName);
            if (cacheFactory) {
                cache = cacheFactory();
                this.caches.set(cacheName, cache);
            }
        }

        return cache;
    }

    /**
     * Retrieves a list of caches by their names.
     * Automatically instantiates caches if instance is missing and cache factory function is registered within {@link CacheRegistry}.
     *
     * @param cacheNames - list of cache names
     */
    static getCaches(cacheNames: CacheName[]): SyncCache[] {
        return cacheNames
            .map(cacheName => this.getCache(cacheName))
            .filter(cache => cache != null) as SyncCache[];
    }

    /**
     * Retrieves a list of caches by their owning object.
     * Automatically instantiates caches if instance is missing and cache factory function is registered within {@link CacheRegistry}.
     *
     * @param target - target object.
     */
    static getCachesByTarget(target: Object): SyncCache[] {
        const cacheNames = CacheRegistry.getRegisteredCacheNamesByTarget(target);
        return this.getCaches(cacheNames);
    }

    /**
     * Returns all instantiated caches.
     */
    static getAllCaches(): SyncCache[] {
        return [...this.caches.values()];
    }

}
