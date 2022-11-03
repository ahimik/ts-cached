import { from, isObservable, Observable } from 'rxjs';
import { ArrayUtil } from '../../utils/array.util';
import { isPromise } from '../../utils/is-promise';
import { SyncCache } from '../cache';
import { CacheManager } from '../cache.manager';
import { Globals } from '../config/globals';
import { CacheLogger } from '../logger/cache-logger';
import { CacheName } from '../model/cache-name';
import { CacheUpdateListener, CacheUpdateListenerFn, CacheUpdateListenerSubject } from '../model/cache.listener';
import { CacheableType, CacheableValueType } from '../model/cacheable-type';
import { CacheFilterConfig } from '../model/config/cache-filter.config';
import { CacheKeyGeneratorConfig } from '../model/config/cache-key-generator.config';
import { CacheNamesConfig } from '../model/config/cache-name.config';
import { PropertyKey } from '../model/property-key';
import { CacheDecoratorDescriptorBuilder } from './builder/cache-decorator-descriptor.builder';
import { CacheDecoratorConfigFactory } from './factory/cache-decorator-config.factory';

/** Cache update decorator configuration */
export interface CacheUpdateDecoratorConfig<E> extends CacheNamesConfig, CacheKeyGeneratorConfig, CacheFilterConfig {
    listener?: CacheUpdateListenerFn<E> | CacheUpdateListenerSubject<E>;
}

/**
 * Updates one or multiple caches.
 * If cache name is not provided then all caches located in the same class will be updated.
 * Applicable to any method return type.
 * Never skips the original method call.
 * Method must return the same value type as @Cacheable method
 *
 * @param cacheNameOrConfig - cache name(s) to be updated or more specific configuration object.
 */
export function CacheUpdate<E = any>(cacheNameOrConfig: CacheName | CacheName[] | CacheUpdateDecoratorConfig<E> = {}) {

    return <T>(target: Object,
               propertyKey: PropertyKey,
               descriptor: TypedPropertyDescriptor<CacheableType<CacheableValueType<T>>>) => {

        const config = CacheDecoratorConfigFactory.createCacheUpdateDecoratorConfig(cacheNameOrConfig);
        const cacheNames = config.cacheName;

        return new CacheDecoratorDescriptorBuilder(target, propertyKey, descriptor)
            .withFilter(config.filter)
            .withKeyGenerator(config.keyGenerator)
            .build((sourceSupplier, cacheKey) => {

                const value = sourceSupplier(); // Always call original function on update
                const caches = findCaches(cacheNames, target);

                if (ArrayUtil.isEmpty(caches)) {
                    CacheLogger.warn('@CacheUpdate: No caches for update. Consider specifying correct cache names.', cacheNames);
                    return value;
                }

                const cacheExecutor = Globals.cacheExecutor;
                const listener = config.listener && new CacheUpdateListener(config.listener);

                const update = (value: Observable<any>) => cacheExecutor.update(caches, cacheKey, value, listener);

                if (isObservable(value)) {
                    return update(value);
                } else if (isPromise(value)) {
                    return update(from(value)).toPromise();
                } else {
                    caches.forEach(cache => cache.put(cacheKey, value));
                    listener && listener.listen({key: cacheKey, value});
                    return value;
                }

            });

    };

}

function findCaches(cacheNames: CacheName | CacheName[] | undefined, target: Object): SyncCache[] {
    return cacheNames
        ? CacheManager.getCaches(ArrayUtil.toArray(cacheNames)) // Get caches by specified cache names if provided
        : CacheManager.getCachesByTarget(target); // Otherwise get by owning object e.g. within the same class
}
