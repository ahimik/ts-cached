import { CacheLogger } from '../logger/cache-logger';
import { CacheKey } from '../model/cache-key';

/**
 * Cache key generator.
 */
export type CacheKeyGenerator = (...args: any) => CacheKey;

/**
 * Default JSON-based cache key generator.
 * @param args - arguments
 */
export const DEFAULT_CACHE_KEY_GENERATOR = (...args: any[]) => {
    try {
        return JSON.stringify(args);
    } catch (err) {
        CacheLogger.error('Error building cache key: ', err, args);
        throw err;
    }
};
