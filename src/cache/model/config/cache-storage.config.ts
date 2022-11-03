/**
 * Configuration model for {@link SyncCacheStorage}
 */
export interface SyncCacheStorageConfig {
    // maximum number of storage entries
    maxSize?: number;
    // Amount of milliseconds since the value has been added to cache after which the entry becomes obsolete
    expireAfterWrite?: number;
    // Amount of milliseconds since the value has been read last time after which the entry becomes obsolete
    expireAfterAccess?: number;
}
