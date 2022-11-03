import { CacheEntry } from '../model/cache-entry';
import { CacheName } from '../model/cache-name';
import { BrowserLocalCacheStorage, BrowserLocalCacheStorageConfig } from './browser-local-cache-storage';
import { InMemorySyncStorage } from './in-memory-cache-storage';
import { SyncStorage } from './storage';

/** Factory function which provides instance of CacheStorage */
export type SyncStorageFactoryFunction<E = any> = (cacheName: CacheName) => SyncStorage<E>;

/**
 * Factory for creating various storage types.
 */
export class StorageFactory {

    /**
     * Creates provider for {@link InMemorySyncStorage}
     */
    static inMemoryStorage<E>(): SyncStorageFactoryFunction<CacheEntry<E>> {
        return (cacheName) => new InMemorySyncStorage<CacheEntry<E>>(cacheName);
    }

    /**
     * Creates provider for {@link BrowserLocalCacheStorage}
     * @param config - BrowserLocalCacheStorage configuration
     */
    static browserLocalStorage<E>(config: BrowserLocalCacheStorageConfig): SyncStorageFactoryFunction<CacheEntry<E>> {
        return (cacheName) => new BrowserLocalCacheStorage<CacheEntry<E>>(cacheName, config);
    }

}
