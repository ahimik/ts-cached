import { Supplier } from '../types/function';
import { AsyncCache, SyncCache } from './cache';
import { CacheInvalidateListener, CacheUpdateListener } from './model/cache.listener';
import { KeyValuePair } from './model/key-value-pair';

export abstract class AbstractSyncCacheDecorator<E> implements SyncCache<E> {

    protected constructor(protected delegate: SyncCache<E>) {
    }

    get(key: string): E | undefined {
        return this.delegate.get(key);
    }

    load(key: string, loadingFn: Supplier<E>): E | undefined {
        return this.delegate.load(key, loadingFn);
    }

    put(key: string, value: E): E {
        return this.delegate.put(key, value);
    }

    invalidate(key: string): void {
        this.delegate.invalidate(key);
    }

    invalidateAll(): void {
        this.delegate.invalidateAll();
    }

    getEntries(): KeyValuePair<E>[] {
        return this.delegate.getEntries();
    }

    async(): AsyncCache<E> {
        return this.delegate.async();
    }

    getName(): string {
        return this.delegate.getName();
    }

    dispose(): void {
        this.delegate.dispose();
    }

    addInvalidateListener(listener: CacheInvalidateListener): void {
        this.delegate.addInvalidateListener(listener);
    }

    addUpdateListener(listener: CacheUpdateListener): void {
        this.delegate.addUpdateListener(listener);
    }

}
