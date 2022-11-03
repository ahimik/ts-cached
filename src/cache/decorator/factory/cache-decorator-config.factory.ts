import { ArrayUtil } from '../../../utils/array.util';
import { StringUtil } from '../../../utils/string.util';
import { CacheName } from '../../model/cache-name';
import { CacheInvalidateDecoratorConfig } from '../cache-invalidate.decorator';
import { CacheUpdateDecoratorConfig } from '../cache-update.decorator';
import { CachedStreamDecoratorConfig } from '../cacheable-stream.decorator';
import { CacheableDecoratorConfig } from '../cacheable.decorator';

/**
 * Cache decorator configuration factory.
 */
export class CacheDecoratorConfigFactory {

    /**
     * Create cache configuration from cache name or config.
     * @param cacheNameOrConfig - cache name or config
     */
    static createCacheDecoratorConfig<E>(cacheNameOrConfig: CacheName | CacheableDecoratorConfig<E>): CacheableDecoratorConfig<E> {
        return StringUtil.isString(cacheNameOrConfig) ? {cacheName: cacheNameOrConfig} : cacheNameOrConfig;
    }

    /**
     * Create cache configuration from cache name or config.
     * @param cacheNameOrConfig - cache name or config
     */
    static createCacheUpdateDecoratorConfig<E>(cacheNameOrConfig: CacheName | CacheName[] | CacheUpdateDecoratorConfig<E>)
        : CacheUpdateDecoratorConfig<E> {
        if (StringUtil.isString(cacheNameOrConfig) || Array.isArray(cacheNameOrConfig)) {
            return {cacheName: ArrayUtil.toArray(cacheNameOrConfig)};
        } else {
            return cacheNameOrConfig;
        }
    }

    /**
     * Create cache configuration from cache name or config.
     * @param cacheNameOrConfig - cache name or config
     */
    static createCacheInvalidateDecoratorConfig(cacheNameOrConfig: CacheName | CacheName[] | CacheInvalidateDecoratorConfig)
        : CacheInvalidateDecoratorConfig {
        if (StringUtil.isString(cacheNameOrConfig) || Array.isArray(cacheNameOrConfig)) {
            return {cacheName: ArrayUtil.toArray(cacheNameOrConfig)};
        } else {
            return cacheNameOrConfig;
        }
    }

    /**
     * Create cache configuration from cache name or config.
     * @param cacheNameOrConfig - cache name or config
     */
    static createStreamedCacheDecoratorConfig<E>(cacheNameOrConfig: CacheName | CachedStreamDecoratorConfig<E>): CachedStreamDecoratorConfig<E> {
        if (StringUtil.isString(cacheNameOrConfig)) {
            return {cacheName: cacheNameOrConfig};
        } else {
            return cacheNameOrConfig;
        }
    }

}
