import { Observable, of } from 'rxjs';
import { fromCallable } from '../observable/from-callable';
import { Supplier } from '../types/function';
import { AbstractSyncCacheDecorator } from './abstract-sync-cache.decorator';
import { AsyncCache, SyncCache } from './cache';

/**
 * Adapter from sync cache version to async.
 */
export class AsyncCacheAdapter<E> extends AbstractSyncCacheDecorator<E> implements AsyncCache<E> {

    constructor(delegate: SyncCache<E>) {
        super(delegate);
    }

    getAsync(key: string): Observable<E | undefined> {
        return of(this.delegate.get(key));
    }

    invalidateAllAsync(): Observable<void> {
        return fromCallable(() => this.delegate.invalidateAll());
    }

    invalidateAsync(key: string): Observable<void> {
        return fromCallable(() => this.delegate.invalidate(key));
    }

    loadAsync(key: string, loadingFn: Supplier<E>): Observable<E | undefined> {
        return fromCallable(() => this.delegate.load(key, loadingFn));
    }

    putAsync(key: string, value: E): Observable<E> {
        return fromCallable(() => this.delegate.put(key, value));
    }

}
