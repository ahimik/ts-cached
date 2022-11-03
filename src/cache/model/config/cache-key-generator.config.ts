import { CacheKeyGenerator } from '../../generator/cache-key.generator';

/**
 * Custom cache key generator configuration.
 */
export interface CacheKeyGeneratorConfig {
    keyGenerator?: CacheKeyGenerator; // Cache key generator
}
