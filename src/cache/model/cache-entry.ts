/**
 * Interface for for cache storage entry.
 */
export interface CacheEntry<E> {
    created: number;
    accessed: number;
    value: E;
}
