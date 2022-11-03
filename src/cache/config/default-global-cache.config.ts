import { DEFAULT_CACHE_KEY_GENERATOR } from '../generator/cache-key.generator';
import { StorageFactory } from '../storage/storage.factory';
import { GlobalCacheConfiguration } from './global-cache.config';

/**
 * Default global cache configuration.
 */
export const DEFAULT_GLOBAL_CACHE_CONFIG: GlobalCacheConfiguration = {
    storageFactory: StorageFactory.inMemoryStorage(),
    keyGenerator: DEFAULT_CACHE_KEY_GENERATOR,
};
