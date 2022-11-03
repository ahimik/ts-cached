import { Observable } from 'rxjs';
import { ArrayUtil } from '../utils/array.util';
import { SyncCache } from './cache';
import { DefaultSyncCache } from './default-sync.cache';
import { CacheName } from './model/cache-name';
import { CacheInvalidateListener, CacheListener, CacheUpdateListener } from './model/cache.listener';
import { UnlessCondition } from './model/unless-condition';
import { SyncCacheStorage } from './storage/cache-storage';

/**
 * Builder for {@link DefaultSyncCache}
 */
export class DefaultSyncCacheBuilder<E> {

    private readonly cacheName: CacheName;
    private storage: SyncCacheStorage<E>;
    private maxSize?: number;
    private expireAfterWrite?: number;
    private expireAfterAccess?: number;
    private listeners?: CacheListener[];
    private invalidateOn?: Observable<any> | Observable<any>[];
    private unless?: UnlessCondition<E>;

    constructor(cacheName: CacheName) {
        this.cacheName = cacheName;
    }

    withStorage(storage: SyncCacheStorage<E>): DefaultSyncCacheBuilder<E> {
        this.storage = storage;
        return this;
    }

    withMaxSize(maxSize?: number): DefaultSyncCacheBuilder<E> {
        if (maxSize && maxSize < 1) {
            throw new Error('Invalid maxSize value. Must be a positive valid number greater than zero');
        }
        this.maxSize = maxSize;
        return this;
    }

    withExpireAfterWrite(expireAfterWrite?: number): DefaultSyncCacheBuilder<E> {
        if (expireAfterWrite && expireAfterWrite < 1) {
            throw new Error('Invalid expireAfterWrite value. Must be a positive valid number greater than zero');
        }
        this.expireAfterWrite = expireAfterWrite;
        return this;
    }

    withExpireAfterAccess(expireAfterAccess?: number): DefaultSyncCacheBuilder<E> {
        if (expireAfterAccess && expireAfterAccess < 1) {
            throw new Error('Invalid expireAfterAccess value. Must be a positive valid number greater than zero');
        }
        this.expireAfterAccess = expireAfterAccess;
        return this;
    }

    withListeners(listeners?: CacheListener[]): DefaultSyncCacheBuilder<E> {
        this.listeners = listeners;
        return this;
    }

    withInvalidateOn(invalidateOn?: Observable<any> | Observable<any>[]): DefaultSyncCacheBuilder<E> {
        this.invalidateOn = invalidateOn;
        return this;
    }

    withUnlessCondition(unless?: UnlessCondition): DefaultSyncCacheBuilder<E> {
        this.unless = unless;
        return this;
    }

    build(): SyncCache<E> {

        const updateListeners: CacheUpdateListener[] = [];
        const invalidateListeners: CacheInvalidateListener[] = [];

        this.listeners && this.listeners.forEach(listener => {
            if (listener instanceof CacheUpdateListener) {
                updateListeners.push(listener);
            } else if (listener instanceof CacheInvalidateListener) {
                invalidateListeners.push(listener);
            }
        });

        return new DefaultSyncCache(this.cacheName, this.storage, {
            maxSize: this.maxSize,
            expireAfterAccess: this.expireAfterAccess,
            expireAfterWrite: this.expireAfterWrite,
            invalidateOn: this.invalidateOn,
            updateListeners: ArrayUtil.isNotEmpty(updateListeners) ? updateListeners : undefined,
            invalidateListeners: ArrayUtil.isNotEmpty(invalidateListeners) ? invalidateListeners : undefined,
            unless: this.unless
        });

    }

}
