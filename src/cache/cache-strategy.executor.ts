import { Observable } from 'rxjs';
import { Supplier } from '../types/function';
import { SyncCache } from './cache';
import { CacheKey } from './model/cache-key';
import { CacheInvalidateListener, CacheUpdateListener } from './model/cache.listener';

export interface InvalidationOptions {
    instant?: boolean; // Whether to invalidate cache(s) instantly or when observable gets completed
    listener?: CacheInvalidateListener;
}

/**
 * Asynchronous cache operations executor.
 * Executes asynchronous cache updates based on selected strategy.
 * Returns patched observable which is used for cache population.
 * Manages running updates against the cache.
 */
export interface CacheStrategyExecutor {

    /**
     * Patches observable to load value in specified cache once observable is completed.
     *
     * @param cache - cache
     * @param sourceSupplier - source observable supplier
     * @param key - given cache key
     *
     * @return - patched observable which should be used instead of the source one.
     */
    load<E>(cache: SyncCache, key: CacheKey, sourceSupplier: Supplier<Observable<E>>): Observable<E>;

    /**
     * Patches observable to update caches asynchronously.
     *
     * @param caches - caches to update
     * @param source - source observable
     * @param key - cache key
     * @param listener - listener to listen for completion event
     *
     * @return - patched observable which should be used instead of the source one.
     */
    update<E>(caches: SyncCache[] | SyncCache, key: CacheKey, source: Observable<E>, listener?: CacheUpdateListener<E>): Observable<E>;

    /**
     * Patches observable to invalidate specified caches asynchronously.
     *
     * @param caches - caches to invalidate
     * @param key - cache key
     * @param source - source observable
     * @param options - options
     *
     * @return - patched observable which should be used instead of the source one.
     */
    invalidate<E>(caches: SyncCache[] | SyncCache, key: CacheKey, source: Observable<E>, options?: InvalidationOptions): Observable<E>;

    /**
     * Patches observable to invalidate all cache entries for specified caches asynchronously.
     *
     * @param caches - caches to invalidate
     * @param source - source observable
     * @param options - options
     *
     * @return - patched observable which should be used instead of the source one.
     */
    invalidateAll<E>(caches: SyncCache[] | SyncCache, source: Observable<E>, options?: InvalidationOptions): Observable<E>;

}

