import { merge, Observable, Subscription } from 'rxjs';
import { Supplier } from '../types/function';
import { MapUtil } from '../utils/map.util';
import { AsyncCacheAdapter } from './async-cache.adapter';
import { AsyncCache, SyncCache } from './cache';
import { CacheLogger } from './logger/cache-logger';
import { CacheEntry } from './model/cache-entry';
import { CacheKey } from './model/cache-key';
import { CacheName } from './model/cache-name';
import { CacheInvalidateListener, CacheUpdateListener } from './model/cache.listener';
import { SyncCacheStorageConfig } from './model/config/cache-storage.config';
import { KeyValuePair } from './model/key-value-pair';
import { UnlessCondition } from './model/unless-condition';
import { SyncCacheStorage } from './storage/cache-storage';
import { CacheStorageMaxSizeController } from './storage/cache-storage-max-size.controller';

/**
 * Default sync cache configuration.
 */
export interface DefaultSyncCacheConfig<E> extends SyncCacheStorageConfig {
    updateListeners?: CacheUpdateListener[];
    invalidateListeners?: CacheInvalidateListener[];
    invalidateOn?: Observable<any> | Observable<any>[];
    unless?: UnlessCondition<E>;
}

/**
 * Default sync cache implementation.
 */
export class DefaultSyncCache<E = any> implements SyncCache<E> {

    private subscription?: Subscription;
    protected updateListeners?: CacheUpdateListener[];
    protected invalidateListeners?: CacheInvalidateListener[];

    constructor(protected cacheName: CacheName,
                protected storage: SyncCacheStorage<E>,
                protected config?: DefaultSyncCacheConfig<E>) {

        if (config?.invalidateOn) {
            this.initInvalidateSubscription(config.invalidateOn);
        }

        if (config?.maxSize) {
            this.storage = new CacheStorageMaxSizeController(storage, config.maxSize);
        }

        this.updateListeners = this.config?.updateListeners;
        this.invalidateListeners = this.config?.invalidateListeners;

    }

    getName(): CacheName {
        return this.cacheName;
    }

    /**
     * Retrieves cached value for the given key.
     * Returns undefined if value doesn't exist.
     * "null" is a valid value for caching.
     *
     * @param key - cache key
     */
    get(key: CacheKey): E | undefined {

        const entry = this.storage.get(key);

        if (entry != null) {

            if (this.isExpired(entry)) {
                CacheLogger.info(`"${this.cacheName}": value EXPIRED. Key: "${key}", value:`, entry.value);
                this.storage.remove(key); // Removing expired entry from storage
            } else {
                this.touchEntry(key, entry); // Updating entry's access time
                CacheLogger.info(`"${this.cacheName}": cache HIT. Key: "${key}", value:`, entry.value);
                return entry.value;
            }

        }

        CacheLogger.info(`"${this.cacheName}": cache MISS. Key: "${key}"`);

        return undefined;
    }

    /**
     * Uses supplying function to load value if value is missing in cache.
     * @param key - cache key
     * @param supplier - source function which provides values for caching
     */
    load(key: CacheKey, supplier: Supplier<E>): E | undefined {

        const value = this.get(key); // Getting valid value

        if (value !== undefined) {
            return value;
        }

        const result = supplier();

        return this.put(key, result);
    }

    /**
     * Puts value in cache.
     * @param key - cache key
     * @param value - value to put
     */
    put(key: string, value: E): E {

        if (this.shouldCache(value)) {

            const now = Date.now();
            this.storage.put(key, {value, created: now, accessed: now});
            this.notifyUpdated(key, value); // Notify value was added to cache
            CacheLogger.info(`"${this.cacheName}": cache PUT. Key: "${key}", value:`, value);

        } else {
            CacheLogger.info(`"${this.cacheName}": skip PUT due to unless condition. Value:`, value);
        }

        return value;
    }

    /**
     * Invalidates cached value.
     * @param key - cache key
     */
    invalidate(key: CacheKey): void {

        const entry = this.storage.get(key);

        if (entry) {
            this.storage.remove(key);
            this.notifyInvalidated(key);
            CacheLogger.info(`"${this.cacheName}": cache INVALIDATE, key: "${key}", value: `, entry.value);
        }

    }

    /**
     * Invalidates all cached values.
     */
    invalidateAll(): void {
        this.storage.clear();
        this.notifyInvalidated();
        CacheLogger.info(`"${this.cacheName}": cache INVALIDATE ALL`);
    }

    /**
     * Registers update listener.
     * @param listener - listener to be registered.
     */
    addUpdateListener(listener: CacheUpdateListener): void {
        this.updateListeners = (this.updateListeners || []).concat([listener]);
    }

    /**
     * Registers invalidate listener.
     * @param listener - listener to be registered.
     */
    addInvalidateListener(listener: CacheInvalidateListener): void {
        this.invalidateListeners = (this.invalidateListeners || []).concat([listener]);
    }

    /**
     * Lists all cache entries.
     * Warning: this method returns all current cache entries including invalid ones
     * since validation happens during value read or write operations.
     */
    getEntries(): KeyValuePair<E>[] {
        return MapUtil.toArrayMap(this.storage.getAsMap(), entry => entry.value);
    }

    /**
     * Estimated cache size.
     * Including invalid entries.
     */
    getSize(): number {
        return this.storage.getSize();
    }

    /**
     * Asynchronous cache version.
     */
    async(): AsyncCache<E> {
        return new AsyncCacheAdapter(this);
    }

    dispose(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    /** Updates entry's access time */
    private touchEntry(key: CacheKey, entry: CacheEntry<E>): void {
        const newEntry = {
            ...entry,
            accessed: Date.now()
        };
        this.storage.put(key, newEntry);
    }

    private isExpired(entry: CacheEntry<E>): boolean {
        const config = this.config;
        if (config?.expireAfterWrite != null && (Date.now() - entry.created > config.expireAfterWrite)) {
            return true;
        }
        if (config?.expireAfterAccess != null && (Date.now() - entry.accessed > config.expireAfterAccess)) {
            return true;
        }
        return false;
    }

    private initInvalidateSubscription(observable: Observable<any> | Observable<any>[]): void {

        observable = Array.isArray(observable)
            ? merge(...observable)
            : observable;

        this.subscription = observable.subscribe(() => this.invalidateAll());

    }

    protected notifyUpdated(key: string, value: E): void {
        if (this.updateListeners) {
            this.updateListeners.forEach(listener => listener.listen({key, value}));
        }
    }

    protected notifyInvalidated(key?: string): void {
        if (this.invalidateListeners) {
            this.invalidateListeners.forEach(listener => listener.listen({key, all: key == null}));
        }
    }

    private shouldCache(value: E): boolean {
        if (!this.config?.unless) {
            return true;
        }
        return this.config.unless(value);
    }

}
