/**
 * Filtering function for conditional caching based on real arguments at runtime.
 */
export type CacheFilter = (...args: any[]) => boolean;
