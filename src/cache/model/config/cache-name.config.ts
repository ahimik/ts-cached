import { CacheName } from '../cache-name';

export interface CacheNameConfig {
    cacheName?: CacheName;
}

export interface CacheNamesConfig {
    cacheName?: CacheName | CacheName[];
}
