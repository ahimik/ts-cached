import { CacheName } from '../model/cache-name';
import { SyncStorage } from './storage';

/**
 * Simple in-memory cache storage implementation based on ES6 Map.
 */
export class InMemorySyncStorage<E> implements SyncStorage<E> {

    private cache = new Map<string, E>();

    constructor(private readonly cacheName: CacheName) {
    }

    get(key: string): E | null {
        return this.cache.get(key) || null;
    }

    put(key: string, item: E): void {
        this.cache.set(key, item);
    }

    remove(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    getAsMap(): Map<string, E> {
        return this.cache; // Ideally we should return immutable map or copy but this is for internal usage only
    }

    getSize(): number {
        return this.cache.size;
    }

}
