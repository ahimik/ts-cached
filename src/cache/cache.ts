import { Observable } from 'rxjs';
import { Supplier } from '../types/function';
import { CacheName } from './model/cache-name';
import { CacheInvalidateListener, CacheUpdateListener } from './model/cache.listener';
import { KeyValuePair } from './model/key-value-pair';

/**
 * Base cache abstraction.
 */
export interface Cache {

    getName(): CacheName;

    addUpdateListener(listener: CacheUpdateListener): void;

    addInvalidateListener(listener: CacheInvalidateListener): void;

    dispose(): void;

}

/**
 * Synchronous cache abstraction.
 */
export interface SyncCache<E = any> extends Cache {

    /** Retrieves value from cache by key */
    get(key: string): E | undefined;

    /** Retrieves or loads value in cache if value is missing */
    load(key: string, loadingFn: Supplier<E>): E | undefined;

    /** Puts given value in cache */
    put(key: string, value: E): E;

    /** Invalidates value related to the given key */
    invalidate(key: string): void;

    /** Invalidates all cache values */
    invalidateAll(): void;

    /** Retrieves all cache entries */
    getEntries(): KeyValuePair<E>[];

    /** Async version of a cache. */
    async(): AsyncCache<E>;

}

/**
 * Asynchronous Cache abstraction.
 */
export interface AsyncCache<E = any> extends Cache {

    getAsync(key: string): Observable<E | undefined>;

    loadAsync(key: string, loadingFn: Supplier<E>): Observable<E | undefined>;

    putAsync(key: string, value: E): Observable<E>;

    invalidateAsync(key: string): Observable<void>;

    invalidateAllAsync(): Observable<void>;

}
