import { Observable, Subject } from 'rxjs';
import { DefaultStreamCache } from './default-stream.cache';
import { CacheName } from './model/cache-name';
import { SyncCacheStorage } from './storage/cache-storage';

/**
 * Builder for {@link DefaultStreamCache}
 */
export class DefaultStreamCacheBuilder<E> {

    private readonly cacheName: CacheName;
    private storage: SyncCacheStorage<E>;
    private loadingListener?: Subject<boolean>;
    private invalidateOn?: Observable<any> | Observable<any>[];

    constructor(cacheName: CacheName) {
        this.cacheName = cacheName;
    }

    withStorage(storage: SyncCacheStorage<E>): DefaultStreamCacheBuilder<E> {
        this.storage = storage;
        return this;
    }

    withLoadingListener(listener?: Subject<boolean>): DefaultStreamCacheBuilder<E> {
        this.loadingListener = listener;
        return this;
    }

    withInvalidateOn(invalidateOn?: Observable<any> | Observable<any>[]): DefaultStreamCacheBuilder<E> {
        this.invalidateOn = invalidateOn;
        return this;
    }

    build(): DefaultStreamCache<E> {
        return new DefaultStreamCache(this.cacheName, this.storage, {
            loadingListener: this.loadingListener,
            invalidateOn: this.invalidateOn
        });
    }

}
