import { MapUtil } from '../../utils/map.util';
import { CacheLogger } from '../logger/cache-logger';
import { KeyValuePair } from '../model/key-value-pair';
import { InMemorySyncStorage } from './in-memory-cache-storage';
import { SyncStorage } from './storage';

/**
 * Configuration for BrowserLocalCacheStorage.
 */
export interface BrowserLocalCacheStorageConfig {
    storageKeyPrefix: string;
}

/**
 * Slow browser local cache storage implementation.
 */
export class BrowserLocalCacheStorage<E> implements SyncStorage<E> {

    private storage: InMemorySyncStorage<E>;

    private readonly storageKey: string;

    constructor(private readonly cacheName: string,
                private readonly config: BrowserLocalCacheStorageConfig) {

        this.storageKey = this.buildCacheStorageKey(cacheName, config);

    }

    get(key: string): E | null {
        return this.loadStorage().get(key);
    }

    put(key: string, entry: E): void {
        this.loadStorage().put(key, entry);
        this.persist();
    }

    remove(key: string): void {
        this.loadStorage().remove(key);
        this.persist();
    }

    clear(): void {
        this.loadStorage().clear();
        this.persist();
    }

    getSize(): number {
        return this.loadStorage().getSize();
    }

    getAsMap(): Map<string, E> {
        return this.loadStorage().getAsMap();
    }

    /** Lazily initializing storage on first access */
    private loadStorage(): InMemorySyncStorage<E> {
        if (!this.storage) {
            this.storage = this.initStorage();
        }
        return this.storage;
    }

    private buildCacheStorageKey(cacheName: string, config: BrowserLocalCacheStorageConfig): string {
        return `${config.storageKeyPrefix}.${cacheName}`;
    }

    private initStorage(): InMemorySyncStorage<E> {
        const storage = new InMemorySyncStorage<E>(this.cacheName);
        const storedKeyValuePairs = localStorage.getItem(this.storageKey);
        if (storedKeyValuePairs) {
            try {
                const keyValuePairs: KeyValuePair<E>[] = JSON.parse(storedKeyValuePairs);
                keyValuePairs.forEach(pair => storage.put(pair.key, pair.value));
            } catch (err) {
                CacheLogger.error(`Error parsing browser local storage cache for key: ${this.storageKey}, error:`, err);
            }
        }
        return storage;
    }

    private persist(): void {

        const cache = this.storage.getAsMap();

        if (cache.size === 0) {
            localStorage.removeItem(this.storageKey);
        } else {
            const keyValuePairs = MapUtil.toArray(cache);
            localStorage.setItem(this.storageKey, JSON.stringify(keyValuePairs));
        }

    }

}
