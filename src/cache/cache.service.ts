import { ArrayUtil } from '../utils/array.util';
import { CacheListenerRegistry } from './cache-listener.registry';
import { CacheManager } from './cache.manager';
import { CacheName } from './model/cache-name';
import { CacheInvalidateListener, CacheUpdateListener } from './model/cache.listener';

export class CacheService {

    /**
     * Creates a link for cascade invalidation between target and dependent caches.
     * Once one of dependent caches is invalidate or updated, all entries in the target cache get invalidated as well.
     *
     * @param targetCacheName - cache to be invalidated cascade
     * @param dependentCacheNames - dependent cache names
     */
    static applyCascadeInvalidation(targetCacheName: CacheName, dependentCacheNames: CacheName | CacheName[]): void {

        const invalidateCache = () => {
            const cache = CacheManager.getCache(targetCacheName);
            cache && cache.invalidateAll();
        };

        const invalidateListener = new CacheInvalidateListener(invalidateCache);
        const updateListener = new CacheUpdateListener(invalidateCache);

        ArrayUtil.toArray(dependentCacheNames).forEach(name => {

            const cache = CacheManager.getCache(name);

            // If cache already exists, then adding listeners to the existing cache instance
            if (cache) {
                cache.addInvalidateListener(invalidateListener);
                cache.addUpdateListener(updateListener);
            } else { // Otherwise registering listeners in a registry for deffer initialization
                CacheListenerRegistry.registerListeners(name, [invalidateListener, updateListener]);
            }

        });

    }

    static isCacheName(value: CacheName | any): value is CacheName {
        return value && typeof value === 'string';
    }

}
