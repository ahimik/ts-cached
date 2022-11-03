import { MapUtil } from '../../utils/map.util';
import { DoubleLinkedListMap } from '../double-linked-list-map';
import { CacheEntry } from '../model/cache-entry';
import { AbstractCacheStorageDecorator } from './abstract-cache-storage.decorator';
import { SyncCacheStorage } from './cache-storage';

export type DropValueListener<E> = (key: string, entry: CacheEntry<E>) => void;

/**
 * Enhances {@link SyncCacheStorage} with capacity functionality.
 * Automatically removes oldest entry from storage when maximum size is exceeded.
 */
export class CacheStorageMaxSizeController<E> extends AbstractCacheStorageDecorator<E> {

    /** Stores keys in a DoubleLinkedListMap in order to control storage capacity */
    private linkedListMap = new DoubleLinkedListMap<string>();

    constructor(delegate: SyncCacheStorage<E>,
                private maxSize: number,
                private listener?: DropValueListener<E>) {

        super(delegate);
        this.init(delegate);
    }

    /**
     * Returns CacheEntry from storage for the given key.
     * Return null if entry is absent.
     * @param key - storage key
     */
    get(key: string): CacheEntry<E> | null {

        const linkedKey = this.linkedListMap.get(key);

        if (linkedKey) {
            const entry = this.storage.get(key);
            if (!entry) { // Unexpected mismatch
                this.linkedListMap.remove(key);
            }
            return entry;
        }
        return null;
    }

    /**
     * Puts entry in storage for provided key.
     * Drops the oldest value, according to the entry.created time if max size is exceeded.
     * @param key - cache key
     * @param entry - cache entry
     * @param notify - whether to notify listeners
     */
    put(key: string, entry: CacheEntry<E>, notify = true): void {
        this.linkedListMap.put(key, key);
        super.put(key, entry);
        this.validateMaxSize(notify);
    }

    /**
     * Removes cache entry by key.
     * @param key - cache key
     */
    remove(key: string): void {
        this.linkedListMap.remove(key);
        super.remove(key);
    }

    /**
     * Clears storage completely.
     */
    clear(): void {
        this.linkedListMap.clear();
        super.clear();
    }

    /**
     * Initializes internal structure which controls storage access and capacity
     * @param storage - storage
     */
    private init(storage: SyncCacheStorage<E>): void {
        if (storage.getSize() > 0) {
            const entries = MapUtil.toArray(storage.getAsMap());
            entries.sort((e1, e2) => e1.value.accessed - e2.value.accessed)
                .forEach(entry => this.put(entry.key, entry.value, false));
        }
    }

    /**
     * Validates maximum size of the storage.
     * @param notify - whether to notify observers of entry removal.
     */
    private validateMaxSize(notify: boolean): void {

        if (this.linkedListMap.getSize() > this.maxSize) {

            const oldestKey = this.linkedListMap.getTail();

            if (oldestKey != null) {

                this.linkedListMap.remove(oldestKey);
                const oldestEntry = this.storage.get(oldestKey);

                if (oldestEntry) {

                    this.storage.remove(oldestKey);

                    if (notify && this.listener) {
                        this.listener(oldestKey, oldestEntry);
                    }
                }
            }
        }
    }

}
