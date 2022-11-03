import { CacheEntry } from '../model/cache-entry';
import { AsyncStorage, SyncStorage } from './storage';

/**
 * Synchronous Cache Storage of cache entries.
 */
export type SyncCacheStorage<E> = SyncStorage<CacheEntry<E>>;

/**
 * Asynchronous Cache Storage of cache entries.
 */
export type AsyncCacheStorage<E> = AsyncStorage<CacheEntry<E>>;
