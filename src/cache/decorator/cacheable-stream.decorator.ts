import { Observable } from 'rxjs';
import { CacheRegistry } from '../cache.registry';
import { CacheManager } from '../cache.manager';
import { GlobalCacheConfig } from '../config/global-cache.config';
import { Globals } from '../config/globals';
import { DefaultStreamCacheBuilder } from '../default-stream-cache.builder';
import { DefaultStreamCache, DefaultStreamCacheConfig } from '../default-stream.cache';
import { DefaultSyncCache } from '../default-sync.cache';
import { CacheLogger } from '../logger/cache-logger';
import { CacheableType } from '../model/cacheable-type';
import { CacheNameConfig } from '../model/config/cache-name.config';
import { PropertyKey } from '../model/property-key';
import { SyncStorageFactoryFunction } from '../storage/storage.factory';
import { CacheDecoratorDescriptorBuilder } from './builder/cache-decorator-descriptor.builder';
import { CacheDecoratorConfigFactory } from './factory/cache-decorator-config.factory';

/** Cached Stream decorator configuration */
export interface CachedStreamDecoratorConfig<E> extends DefaultStreamCacheConfig<E>, CacheNameConfig {
    storageFactory?: SyncStorageFactoryFunction;
    invalidateOn?: Observable<any> | Observable<any>[];
}

/**
 * Opens endless stream which loads source observable value on subscribe and emits changes over time.
 * 1. Re-executes original source function when cache is invalidated.
 * 2. Emits new value when cache is updated.
 */
export function CacheableStream<E>(cacheNameOrConfig: string | CachedStreamDecoratorConfig<E> = {}) {

    return <T extends Observable<any>>(target: Object,
                                       propertyKey: PropertyKey,
                                       descriptor: TypedPropertyDescriptor<CacheableType<T>>) => {

        const config = CacheDecoratorConfigFactory.createStreamedCacheDecoratorConfig(cacheNameOrConfig);
        const cacheName = config.cacheName || Globals.cacheNameGenerator.generate(target, propertyKey);

        const cacheFactory = () => buildStreamCache(cacheName, config);

        CacheRegistry.registerCacheFactory(target, propertyKey, cacheName, cacheFactory);

        return new CacheDecoratorDescriptorBuilder(target, propertyKey, descriptor)
            .build((sourceSupplier, cacheKey) => {

                const cache = CacheManager.getCache(cacheName);

                if (!(cache instanceof DefaultStreamCache)) {
                    CacheLogger.error(`@CacheableStream: invalid cache instance type, expected: ${DefaultSyncCache.prototype}`);
                    return sourceSupplier();
                }

                return cache.loadStream(cacheKey, sourceSupplier) as T;

            });

    };
}

/**
 * Builds streamed cache according to provided config.
 * @param cacheName - cache name
 * @param config - configuration
 */
function buildStreamCache<E>(cacheName: string, config: CachedStreamDecoratorConfig<E>): DefaultStreamCache<E> {

    const globalConfig = GlobalCacheConfig.get();

    const storageFactory = config.storageFactory || globalConfig.storageFactory;
    const storage = storageFactory(cacheName);

    return new DefaultStreamCacheBuilder<E>(cacheName)
        .withStorage(storage)
        .withLoadingListener(config.loadingListener)
        .withInvalidateOn(config.invalidateOn)
        .build();

}
