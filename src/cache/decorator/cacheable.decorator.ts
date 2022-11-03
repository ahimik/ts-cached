import { from, isObservable, Observable } from 'rxjs';
import { ArrayUtil } from '../../utils/array.util';
import { SyncCache } from '../cache';
import { CacheRegistry } from '../cache.registry';
import { CacheListenerRegistry } from '../cache-listener.registry';
import { CacheManager } from '../cache.manager';
import { CacheService } from '../cache.service';
import { GlobalCacheConfig } from '../config/global-cache.config';
import { Globals } from '../config/globals';
import { DefaultSyncCacheBuilder } from '../default-sync-cache.builder';
import { CacheName } from '../model/cache-name';
import { CacheableType, CacheableValueType } from '../model/cacheable-type';
import { CacheFilterConfig } from '../model/config/cache-filter.config';
import { CacheKeyGeneratorConfig } from '../model/config/cache-key-generator.config';
import { CacheNameConfig } from '../model/config/cache-name.config';
import { SyncCacheStorageConfig } from '../model/config/cache-storage.config';
import { PropertyKey } from '../model/property-key';
import { ReturnType } from '../model/return-type';
import { UnlessCondition } from '../model/unless-condition';
import { SyncStorageFactoryFunction } from '../storage/storage.factory';
import { CacheDecoratorDescriptorBuilder } from './builder/cache-decorator-descriptor.builder';
import { CacheDecoratorConfigFactory } from './factory/cache-decorator-config.factory';

export type InvalidateSource = Observable<any> | CacheName | Array<Observable<any> | CacheName>;

/**
 * Cache Decorator configuration.
 */
export interface CacheableDecoratorConfig<E> extends CacheNameConfig,
    SyncCacheStorageConfig,
    CacheFilterConfig,
    CacheKeyGeneratorConfig {
    storageFactory?: SyncStorageFactoryFunction,
    invalidateOn?: InvalidateSource; // Invalidation source
    unless?: UnlessCondition<E>; // Cache value unless condition
}

/**
 * Loads value from cache or target function.
 * Executes original function if value is absent and caches it.
 * Joins simultaneous requests for the same cache key in order to
 * Applies caching to a given method according to provided configuration.
 * If cache name is not provided, then it will be generated automatically.
 *
 * @param cacheNameOrConfig - cache name or more detailed configuration.
 */
export function Cacheable<E>(cacheNameOrConfig: CacheName | CacheableDecoratorConfig<E> = {}) {

    return <T>(target: Object,
               propertyKey: PropertyKey,
               descriptor: TypedPropertyDescriptor<CacheableType<CacheableValueType<T>>>) => {

        const config = CacheDecoratorConfigFactory.createCacheDecoratorConfig(cacheNameOrConfig);

        // Attempt to automatically resolve method return type
        let returnType = Globals.returnTypeResolver.resolve(target, propertyKey);

        const cacheName = config.cacheName || Globals.cacheNameGenerator.generate(target, propertyKey);

        const dependentCacheNames = filterCacheNames(config.invalidateOn);
        // Registering cascade invalidation
        if (ArrayUtil.isNotEmpty(dependentCacheNames)) {
            CacheService.applyCascadeInvalidation(cacheName, dependentCacheNames);
        }

        const cacheFactory = () => buildCache(cacheName, config);

        // Registering factory function to deffer cache instantiation.
        CacheRegistry.registerCacheFactory(target, propertyKey, cacheName, cacheFactory);

        return new CacheDecoratorDescriptorBuilder(target, propertyKey, descriptor)
            .withFilter(config.filter)
            .withKeyGenerator(config.keyGenerator)
            .build((sourceSupplier, cacheKey) => {

                const cache = CacheManager.getCache(cacheName)!; // Cache must be defined

                // Identify return type by running source method if RETURN_TYPE_RESOLVER couldn't get it.
                if (!returnType) {
                    const value = sourceSupplier(); // Run original function to get the result
                    sourceSupplier = () => value; // Re-wrap the source to return the obtained value directly in order to avoid calling original function again
                    returnType = Globals.valueTypeResolver.resolve(value); // Resolve value type
                }

                const cacheExecutor = Globals.cacheExecutor;

                switch (returnType) {
                    case ReturnType.Observable: {
                        return cacheExecutor.load(cache, cacheKey, sourceSupplier);
                    }
                    case ReturnType.Promise: {
                        return cacheExecutor.load(cache, cacheKey, () => from(sourceSupplier())).toPromise();
                    }
                    default:
                        return cache.load(cacheKey, sourceSupplier);
                }

            });
    };

}

/**
 * Builds cache instance according to the provided configuration.
 * @param cacheName - cache name
 * @param config - configuration
 */
function buildCache<E>(cacheName: CacheName, config: CacheableDecoratorConfig<E>): SyncCache<E> {

    const globalConfig = GlobalCacheConfig.get();
    const listeners = CacheListenerRegistry.getRegisteredListeners(cacheName);
    const invalidateOnObservable = config.invalidateOn
        ? ArrayUtil.toArray(config.invalidateOn).filter(value => isObservable(value)) as Observable<any>[]
        : undefined;

    const storageFactory = config.storageFactory || globalConfig.storageFactory;

    const storage = storageFactory(cacheName);

    return new DefaultSyncCacheBuilder<E>(cacheName)
        .withStorage(storage)
        .withListeners(listeners)
        .withMaxSize(config.maxSize || globalConfig.maxSize)
        .withExpireAfterWrite(config.expireAfterWrite || globalConfig.expireAfterWrite)
        .withExpireAfterAccess(config.expireAfterAccess || globalConfig.expireAfterAccess)
        .withInvalidateOn(invalidateOnObservable)
        .withUnlessCondition(config.unless)
        .build();

}

function filterCacheNames(invalidateOn?: InvalidateSource): CacheName[] {
    if (!invalidateOn) {
        return [];
    }
    return ArrayUtil.toArray(invalidateOn)
        .filter(cacheNameOrObservable => CacheService.isCacheName(cacheNameOrObservable)) as CacheName[];
}
