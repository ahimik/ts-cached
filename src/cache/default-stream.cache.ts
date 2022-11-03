import { merge, Observable, Subscription } from 'rxjs';
import { Supplier } from '../types/function';
import { AbstractSyncCacheDecorator } from './abstract-sync-cache.decorator';
import { CacheableStream, CachedStreamConfig, RefreshRequest, UpdateRequest } from './cacheable-stream';
import { DefaultSyncCache } from './default-sync.cache';
import { CacheLogger } from './logger/cache-logger';
import { CacheName } from './model/cache-name';
import { SyncCacheStorage } from './storage/cache-storage';

/** Stream cache configuration */
export interface DefaultStreamCacheConfig<E> extends Omit<CachedStreamConfig<E>, 'initialValue' | 'valueLoaded'> {
    invalidateOn?: Observable<any> | Observable<any>[];
}

export class DefaultStreamCache<E> extends AbstractSyncCacheDecorator<E> {

    /** Stream instance */
    private stream: CacheableStream<E> | null;
    /** Last executed cache key */
    private lastCacheKey: string;
    /** Single storage key for last emitted stream value */
    private readonly storageValueKey = '';

    private invalidateOnSubscription?: Subscription;

    constructor(cacheName: CacheName,
                storage: SyncCacheStorage<E>, // Storage for storing last emitted stream value
                private streamConfig?: DefaultStreamCacheConfig<E>) {

        super(new DefaultSyncCache(cacheName, storage));

        if (streamConfig?.invalidateOn) {
            this.initInvalidateOnSubscription(streamConfig.invalidateOn);
        }

    }

    /**
     * Loads cacheable stream.
     *
     * @param key - cache key
     * @param supplier - source observable supplier
     */
    loadStream(key: string, supplier: Supplier<Observable<E>>): Observable<E> {
        if (!this.stream) {
            this.stream = this.initStream(supplier);
            CacheLogger.info(`"${this.getName()}": stream LOADED.`);
        } else if (this.lastCacheKey !== key) {
            CacheLogger.info(`"${this.getName()}": stream key changed, re-subscribing to source observable`);
            this.stream.setSource(supplier);
            this.stream.request(new RefreshRequest());
        }
        this.lastCacheKey = key;
        return this.stream.getStream();
    }

    /**
     * Emits new value to the stream.
     * @param key - cacheable key
     * @param value - new value
     */
    put(key: string, value: E): E {
        if (this.stream) {
            this.stream.request(new UpdateRequest(value));
            CacheLogger.info(`"${this.getName()}": stream UPDATED, key: "${key}", value:`, value);
        }
        return value;
    }

    /**
     * Invalidates stream.
     * Re-subscribes to source observable and emits new value.
     */
    invalidate(): void {
        // Invalidate all entries since we keep only last emitted value
        this.invalidateAll();
    }

    /**
     * Invalidates stream.
     * Re-subscribes to source observable and emits new value.
     */
    invalidateAll(): void {
        if (this.stream) {
            // Send the request to re-subscribe to the source observable and cache new value
            this.stream.request(new RefreshRequest());
            CacheLogger.info(`"${this.getName()}": stream INVALIDATED`);
        }
        super.invalidateAll();
    }

    dispose(): void {
        if (this.stream) {
            this.stream.dispose();
            this.stream = null;
        }
        if (this.invalidateOnSubscription) {
            this.invalidateOnSubscription.unsubscribe();
        }
    }

    private initStream(supplier: Supplier<Observable<E>>): CacheableStream<E> {
        const initialValue = this.get(this.storageValueKey);
        return new CacheableStream<E>(supplier, {
            ...this.streamConfig,
            initialValue,
            valueLoaded: value => super.put(this.storageValueKey, value)
        });
    }

    private initInvalidateOnSubscription(observable: Observable<any> | Observable<any>[]): void {

        observable = Array.isArray(observable)
            ? merge(...observable)
            : observable;

        this.invalidateOnSubscription = observable.subscribe(() => this.invalidateAll());
    }

}
