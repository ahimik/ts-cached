import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { doOnSubscribe } from '../observable/do-on-subscribe';
import { Supplier } from '../types/function';
import { ArrayUtil } from '../utils/array.util';
import { SyncCache } from './cache';
import { CacheStrategyExecutor, InvalidationOptions } from './cache-strategy.executor';
import { CacheKey } from './model/cache-key';
import { CacheName } from './model/cache-name';
import { CacheUpdateListener } from './model/cache.listener';

/**
 * 1. Shares cache loads and cache updates operations with the same key.
 * 2. Drains all cache values from the source observable(if it emits multiple values) and caches the last one only.
 */
export class ShareReplayCacheStrategyExecutor implements CacheStrategyExecutor {

    /** Running shared observables(loads and updates) per cache and cache key */
    private shared = new Map<CacheName, Map<CacheKey, Observable<any>>>();

    /**
     * 1. Returns value from cache immediately if value is present.
     * 2. Returns shared observable if another update request is in progress.
     * 3. Patches observable to load and cache value.
     * @param cache - cache
     * @param key - cache key
     * @param sourceSupplier - source observable supplier
     */
    load<E>(cache: SyncCache, key: CacheKey, sourceSupplier: Supplier<Observable<E>>): Observable<E> {

        const shared = this.findSharedObservable(cache.getName(), key);
        // If update operation is already in progress
        if (shared != null) {
            // Then share update operation between subscribers
            return shared;
        }
        // Else get value from cache
        const cachedValue = cache.get(key);
        // If value exists
        if (cachedValue !== undefined) { // Undefined is not cached
            // Then return cached value
            return of(cachedValue);
        }
        // Else execute original source function and cache value
        return this.update([cache], key, sourceSupplier());
    }

    /**
     * Patches an observable to load new cache value by key.
     * Shares the patched observable with "load" operation.
     *
     * @param cachesToUpdate - cache(s) to update
     * @param key - cache key
     * @param source - source observable
     * @param listener - update listener
     */
    update<E>(cachesToUpdate: SyncCache | SyncCache[],
              key: CacheKey,
              source: Observable<E>,
              listener?: CacheUpdateListener<E>): Observable<E> {

        const caches = ArrayUtil.toArray(cachesToUpdate);

        const patchedSource = source.pipe(
            tap(value => {
                caches.forEach(cache => cache.put(key, value));
                listener && listener.listen({key, value});
            }),
            finalize(() => {
                caches.forEach(cache => this.deleteSharedObservable(cache.getName(), key, patchedSource));
            }),
            shareReplay(1)
        );

        // We share observable immediately regardless of subscription
        // otherwise operations like forkJoin([req, req ,req]) will not join identical requests
        caches.forEach(cache => this.shareObservable(cache.getName(), key, patchedSource));

        return patchedSource;
    }

    /**
     * Patches an observable to update given caches
     *
     * @param cachesToInvalidate - caches to invalidate
     * @param key - cache key
     * @param source - source observable
     * @param options - options
     */
    invalidate<E>(cachesToInvalidate: SyncCache | SyncCache[],
                  key: CacheKey,
                  source: Observable<E>,
                  options?: InvalidationOptions): Observable<E> {

        const caches = ArrayUtil.toArray(cachesToInvalidate);

        const invalidateCaches = () => {
            caches.forEach(cache => cache.invalidate(key));
            options?.listener && options.listener.listen({key});
        };

        if (options?.instant) {
            return source.pipe(doOnSubscribe(invalidateCaches));
        } else {
            return source.pipe(tap(invalidateCaches));
        }

    }

    /**
     * Patches an observable to update given caches
     *
     * @param cachesToInvalidate - caches to invalidate
     * @param source - source observable
     * @param options - invalidation options
     */
    invalidateAll<E>(cachesToInvalidate: SyncCache | SyncCache[],
                     source: Observable<E>,
                     options?: InvalidationOptions): Observable<E> {

        const caches = ArrayUtil.toArray(cachesToInvalidate);

        const invalidateCaches = () => {
            caches.forEach(cache => cache.invalidateAll());
            options?.listener && options.listener.listen({all: true});
        };

        if (options?.instant) {
            return source.pipe(doOnSubscribe(invalidateCaches));
        } else {
            return source.pipe(tap(invalidateCaches));
        }
    }

    private findSharedObservable<E = any>(cacheName: CacheName, cacheKey: CacheKey): Observable<E> | undefined {
        return this.shared.get(cacheName)?.get(cacheKey);
    }

    /** Add given source to the shared map */
    private shareObservable<E>(cacheName: CacheName, cacheKey: CacheKey, source: Observable<E>): void {

        let sharedMap = this.shared.get(cacheName);

        if (!sharedMap) {
            sharedMap = new Map<CacheKey, Observable<E>>();
            this.shared.set(cacheName, sharedMap);
        }

        sharedMap.set(cacheKey, source); // Overwrites existing observable if any
    }

    /** Deletes given source from the shared map */
    private deleteSharedObservable<E>(cacheName: CacheName, cacheKey?: CacheKey, source?: Observable<E>): void {

        const sharedMap = this.shared.get(cacheName);

        if (sharedMap) {
            if (cacheKey && (!source || source == sharedMap.get(cacheKey))) {
                sharedMap.delete(cacheKey);
            } else {
                this.shared.delete(cacheName);
            }
        }

    }

}

export const SHARE_REPLAY_CACHE_EXECUTOR = new ShareReplayCacheStrategyExecutor();
