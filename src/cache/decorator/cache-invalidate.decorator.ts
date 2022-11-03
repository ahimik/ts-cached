import { from, isObservable, Observable } from 'rxjs';
import { ArrayUtil } from '../../utils/array.util';
import { isPromise } from '../../utils/is-promise';
import { CacheManager } from '../cache.manager';
import { Globals } from '../config/globals';
import { CacheLogger } from '../logger/cache-logger';
import { CacheName } from '../model/cache-name';
import { CacheInvalidateListener, CacheInvalidateListenerFn, CacheInvalidateListenerSubject } from '../model/cache.listener';
import { CacheableType, CacheableValueType } from '../model/cacheable-type';
import { CacheFilterConfig } from '../model/config/cache-filter.config';
import { CacheKeyGeneratorConfig } from '../model/config/cache-key-generator.config';
import { CacheNamesConfig } from '../model/config/cache-name.config';
import { PropertyKey } from '../model/property-key';
import { CacheDecoratorDescriptorBuilder } from './builder/cache-decorator-descriptor.builder';
import { CacheDecoratorConfigFactory } from './factory/cache-decorator-config.factory';

export interface CacheInvalidateDecoratorConfig extends CacheNamesConfig, CacheKeyGeneratorConfig, CacheFilterConfig {
    all?: boolean; // Whether to invalidate all entries
    instant?: boolean; // Whether to invalidate cache instantly or wait for an observable or promise to be completed
    listener?: CacheInvalidateListenerFn | CacheInvalidateListenerSubject; // Listens when operation is completed
}

/**
 * Invalidates one or multiple caches.
 * If cache name is not provided then all caches located in the same class will be invalidated.
 * Applicable to any method return type.
 * Never skips the original method call.
 *
 * @param cacheNamesOrConfig - cache name(s) to invalidate or more detailed configuration.
 */
export function CacheInvalidate(cacheNamesOrConfig: CacheName | CacheName[] | CacheInvalidateDecoratorConfig = {}) {

    return <T>(target: Object,
               propertyKey: PropertyKey,
               descriptor: TypedPropertyDescriptor<CacheableType<CacheableValueType<T>>>) => {

        const config = CacheDecoratorConfigFactory.createCacheInvalidateDecoratorConfig(cacheNamesOrConfig);
        const {cacheName, all} = config;

        return new CacheDecoratorDescriptorBuilder(target, propertyKey, descriptor)
            .withFilter(config.filter)
            .withKeyGenerator(config.keyGenerator)
            .build((sourceSupplier, cacheKey) => {

                const value = sourceSupplier(); // Always call original function on invalidate

                const caches = findCaches(cacheName, target);

                if (ArrayUtil.isEmpty(caches)) {
                    CacheLogger.warn('@CacheInvalidate: No caches found. Consider specifying correct cache name(s)');
                    return value;
                }

                const cacheExecutor = Globals.cacheExecutor;
                const instant = config.instant;
                const listener = config.listener && new CacheInvalidateListener(config.listener);

                const invalidateAsync = (source: Observable<any>) => all
                    ? cacheExecutor.invalidateAll(caches, source, {instant, listener})
                    : cacheExecutor.invalidate(caches, cacheKey, source, {instant, listener});

                if (isObservable(value)) {
                    return invalidateAsync(value);
                } else if (isPromise(value)) {
                    return invalidateAsync(from(value)).toPromise();
                } else {
                    caches.forEach(cache => all ? cache.invalidateAll() : cache.invalidate(cacheKey));
                    listener && listener.listen({key: all ? undefined : cacheKey, all});
                    return value;
                }

            });

    };

}

function findCaches(cacheNames: CacheName | CacheName[] | undefined, target: Object) {
    return cacheNames
        ? CacheManager.getCaches(ArrayUtil.toArray(cacheNames)) // Get caches by specified cache names if provided
        : CacheManager.getCachesByTarget(target); // Otherwise get by owning object e.g. within the same class
}
