import { Observable, of } from 'rxjs';
import { Cacheable, CacheUpdate, GlobalCacheConfig, StorageFactory } from '../src';
import { CacheManager } from '../src/cache/cache.manager';
import { DefaultSyncCacheBuilder } from '../src/cache/default-sync-cache.builder';
import { KeyValuePair } from '../src/cache/model/key-value-pair';
import { generateCacheKey } from './utils/cache-key.generator';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1, user2, user3 } from './utils/user';

describe('Cache Storage >', () => {

    beforeEach(() => {
        GlobalCacheConfig.resetToDefaults();
        jasmine.clock().uninstall();
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        localStorage.clear();
    });

    it('Should delete oldest cache entry when maximum size limit is exceeded', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable({cacheName, maxSize: 2})
            findUser(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;

        await service.findUser(user1).toPromise();
        expect(cache.getEntries().length).toEqual(1);
        await service.findUser(user2).toPromise();
        expect(cache.getEntries().length).toEqual(2);
        await service.findUser(user3).toPromise();
        expect(cache.getEntries().length).toEqual(2);
        expect(cache.getEntries().some((entry: KeyValuePair<User>) => entry.value === user2)).toBeTruthy();
        expect(cache.getEntries().some((entry: KeyValuePair<User>) => entry.value === user3)).toBeTruthy();

    });

    it('Should save value to local storage', async () => {

        // Clearing local storage for clean test
        localStorage.clear();

        const cacheName = nextCacheName();
        const storageKeyPrefix = 'storage';
        const storageKey = `${storageKeyPrefix}.${cacheName}`;

        class Service {

            @Cacheable({cacheName, storageFactory: StorageFactory.browserLocalStorage({storageKeyPrefix})})
            findUser(id: number): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            updateUser(id: number): Observable<User> {
                return of(user2);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;

        // When value is cached
        await service.findUser(1).toPromise();

        // Then value must be saved to local storage
        expect(localStorage.getItem(storageKey)).toBeDefined();

        // Should restore from storage when new cache instance is created
        const newCache = new DefaultSyncCacheBuilder(cacheName)
            .withStorage(StorageFactory.browserLocalStorage({storageKeyPrefix})(cacheName))
            .build();

        expect(newCache.getEntries().length).toEqual(1);

        // When cache value invalidated
        cache.invalidateAll();
        // Then value must be removed from storage
        expect(localStorage.getItem(storageKey)).toBeNull();

    });

    it('Should restore value from local storage and restore correct access order for maxSize validation', async () => {

        // Clearing local storage for clean test
        localStorage.clear();

        const cacheName = nextCacheName();
        const storageKeyPrefix = 'storage';

        class Service {

            @Cacheable({
                cacheName,
                storageFactory: StorageFactory.browserLocalStorage({storageKeyPrefix}),
                maxSize: 2
            })
            findUser(id: number): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();

        // When multiple values get cached
        await service.findUser(1).toPromise();
        await service.findUser(2).toPromise();

        // And new cache instance with the same storage key is created
        const newCache = new DefaultSyncCacheBuilder(cacheName)
            .withStorage(StorageFactory.browserLocalStorage({storageKeyPrefix})(cacheName))
            .withMaxSize(2)
            .build();

        // Then all cached values must be present in a restored cache
        expect(newCache.getEntries().length).toEqual(2);

        // When new value gets cached
        newCache.put(generateCacheKey(3), user3);
        // Then oldest value must be removed from cache
        expect(newCache.getEntries().length).toEqual(2);
        expect(newCache.get(generateCacheKey(1)) != null).toBeFalsy('Oldest value must be absent');

    });

});
