import { CacheKeyGenerator } from '../generator/cache-key.generator';
import { SyncCacheStorageConfig } from '../model/config/cache-storage.config';
import { SyncStorageFactoryFunction } from '../storage/storage.factory';
import { DEFAULT_GLOBAL_CACHE_CONFIG } from './default-global-cache.config';

export interface GlobalCacheConfiguration extends SyncCacheStorageConfig {
    keyGenerator: CacheKeyGenerator;
    storageFactory: SyncStorageFactoryFunction;
}

/**
 * Global cache configuration accessor.
 */
export class GlobalCacheConfig {

    private static config = DEFAULT_GLOBAL_CACHE_CONFIG;

    /**
     * Returns current global cache configuration value.
     */
    static get(): GlobalCacheConfiguration {
        return this.config;
    }

    /**
     * Partially updates current global cache configuration.
     */
    static set(config: Partial<GlobalCacheConfiguration>): void {
        const mergedConfig = {
            ...this.config,
            ...config
        };
        this.validate(mergedConfig);
        this.config = mergedConfig;
    }

    /**
     * Resets current global cache configuration to DEFAULT VALUES.
     */
    static resetToDefaults(): void {
        this.config = DEFAULT_GLOBAL_CACHE_CONFIG;
    }

    private static validate(config: GlobalCacheConfiguration): void {
        if (config.maxSize && config.maxSize < 1) {
            throw new Error('Invalid global cache configuration: Invalid maxSize value. Must be a valid positive number');
        }
        if (config.expireAfterWrite && config.expireAfterWrite < 1) {
            throw new Error('Invalid global cache configuration: Invalid expireAfterWrite value. Must be a valid positive number');
        }
        if (config.expireAfterAccess && config.expireAfterAccess < 1) {
            throw new Error('Invalid global cache configuration: Invalid expireAfterWrite value. Must be a valid positive number');
        }
    }

}

