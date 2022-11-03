import { GlobalCacheConfig } from '../../src';
import { CacheKey } from '../../src/cache/model/cache-key';

export function generateCacheKey(...args: any[]): CacheKey {
    return GlobalCacheConfig.get().keyGenerator(...args);
}
