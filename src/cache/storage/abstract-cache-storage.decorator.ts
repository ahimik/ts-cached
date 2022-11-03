import { CacheEntry } from '../model/cache-entry';
import { SyncCacheStorage } from './cache-storage';

/**
 * Abstract decorator.
 */
export class AbstractCacheStorageDecorator<E> implements SyncCacheStorage<E> {

    constructor(protected storage: SyncCacheStorage<E>) {
    }

    get(key: string): CacheEntry<E> | null {
        return this.storage.get(key);
    }

    put(key: string, entry: CacheEntry<E>): void {
        this.storage.put(key, entry);
    }

    remove(key: string): void {
        this.storage.remove(key);
    }

    clear(): void {
        this.storage.clear();
    }

    getAsMap(): Map<string, CacheEntry<E>> {
        return this.storage.getAsMap();
    }

    getSize(): number {
        return this.storage.getSize();
    }

}
