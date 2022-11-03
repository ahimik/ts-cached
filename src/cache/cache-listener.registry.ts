import { ArrayUtil } from '../utils/array.util';
import { CacheName } from './model/cache-name';
import { CacheListener } from './model/cache.listener';

/**
 * Registry for cache listeners.
 * Is used by Cache Decorators to register listeners and use them in caches.
 */
export class CacheListenerRegistry {

    private static listeners = new Map<CacheName, CacheListener[]>();

    /**
     * Returns an array of cache listeners registered for the given cache name.
     * @param cacheName - cache name
     */
    public static getRegisteredListeners(cacheName: CacheName): CacheListener[] | undefined {
        const listeners = this.listeners.get(cacheName);
        return listeners && [...listeners];
    }

    /**
     * Registers cache listener for the given cache name that can be used later on.
     * @param cacheName - cache name
     * @param listener - listener
     */
    public static registerListeners(cacheName: CacheName | CacheName[], listener: CacheListener | CacheListener[]): void {

        const cacheNames = ArrayUtil.toArray(cacheName);

        cacheNames.forEach(name => {

            const listeners = ArrayUtil.toArray(listener);

            const resultListeners = (this.listeners.get(name) || []).concat(listeners);
            this.listeners.set(name, resultListeners);

        });

    }

}
