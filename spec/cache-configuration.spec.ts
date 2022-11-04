import { Observable, of } from 'rxjs';
import { Cacheable, GlobalCacheConfig, SyncStorage } from '../src';
import { CacheManager } from '../src/cache/cache.manager';
import { VOID } from '../src/types/void';
import { generateCacheKey } from './utils/cache-key.generator';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1 } from './utils/user';

describe('Cache Configuration >', () => {

    beforeEach(() => {
        GlobalCacheConfig.resetToDefaults();
        jasmine.clock().uninstall();
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('Should use custom cache key generator', async () => {

        const customCacheKey = 'CustomCacheKey';
        const cacheName = nextCacheName();

        const keyGenerator = (...args: any[]) => customCacheKey;

        GlobalCacheConfig.set({keyGenerator});

        class Service {

            @Cacheable(cacheName)
            findUser(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        await service.findUser(user1).toPromise();

        expect(cache.getEntries()[0].key).toEqual(customCacheKey);

    });

    it('Should use custom cache storage', async () => {

        const cacheName = nextCacheName();

        class CustomStorage implements SyncStorage<User> {

            get(key: string): User | null {
                return null;
            }

            getAsMap(): Map<string, User> {
                return new Map();
            }

            getSize(): number {
                return 0;
            }

            put(key: string, item: User): void {
                return VOID;
            }

            remove(key: string): void {
                return VOID;
            }

            clear(): void {
                return VOID;
            }

        }

        const customStorage = new CustomStorage();
        const customStorageGetSpy = spyOn(customStorage, 'get').and.callThrough();
        const customStoragePutSpy = spyOn(customStorage, 'put').and.callThrough();

        GlobalCacheConfig.set({storageFactory: () => customStorage});

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

        }

        jasmine.clock().mockDate();
        const service = new Service();
        await service.findUser().toPromise();
        expect(customStorageGetSpy).toHaveBeenCalledWith('[]');
        expect(customStoragePutSpy).toHaveBeenCalledWith('[]', {
            value: user1,
            created: Date.now(),
            accessed: Date.now()
        });

    });

    it('Should set maxSize globally', async () => {

        const cacheName = nextCacheName();
        const maxSize = 1;

        GlobalCacheConfig.set({maxSize});

        class Service {

            @Cacheable(cacheName)
            findUser(id: number): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        for (let i = 1; i < 10; i++) {
            await service.findUser(i).toPromise();
        }
        expect(cache.getEntries().length).toEqual(maxSize);

    });

    it('Should take precedence over global max size setting', async () => {

        const cacheName = nextCacheName();
        const globalMaxSize = 5;
        const maxSize = 3;

        GlobalCacheConfig.set({maxSize: globalMaxSize});

        class Service {

            @Cacheable({cacheName, maxSize})
            findUser(id: number): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        for (let i = 1; i < 10; i++) {
            await service.findUser(i).toPromise();
        }
        expect(cache.getEntries().length).toEqual(maxSize);

    });

    it('Should set expireAfterWrite globally', async () => {

        const cacheName = nextCacheName();
        const expireAfterWrite = 100;

        GlobalCacheConfig.set({expireAfterWrite});

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        jasmine.clock().mockDate();
        await service.findUser().toPromise();
        jasmine.clock().tick(expireAfterWrite + 1);
        expect(cache.get(generateCacheKey()) != null).toBeFalsy('Value must be absent');

    });

    it('Should take precedence over expireAfterWrite set globally', async () => {

        const cacheName = nextCacheName();
        const globalExpireAfterWrite = 50;
        const expireAfterWrite = 100;

        GlobalCacheConfig.set({expireAfterWrite: globalExpireAfterWrite});

        class Service {

            @Cacheable({cacheName, expireAfterWrite})
            findUser(): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        jasmine.clock().mockDate();
        await service.findUser().toPromise();
        jasmine.clock().tick(globalExpireAfterWrite + 1);
        expect(cache.get(generateCacheKey()) != null).toBeTruthy('Value must be present when entry is not expired');
        jasmine.clock().tick((expireAfterWrite - globalExpireAfterWrite) + 1);
        expect(cache.get(generateCacheKey()) != null).toBeFalsy('Value must be absent when entry has expired');

    });

    it('Should set expireAfterAccess globally', async () => {

        const cacheName = nextCacheName();
        const expireAfterAccess = 100;

        GlobalCacheConfig.set({expireAfterAccess});

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        jasmine.clock().mockDate();
        await service.findUser().toPromise();
        jasmine.clock().tick(expireAfterAccess - 1);
        expect(cache.get(generateCacheKey()) != null).toBeTruthy('Value must be present when entry is not expired');
        jasmine.clock().tick(expireAfterAccess + 1);
        expect(cache.get(generateCacheKey()) != null).toBeFalsy('Value must be absent when entry has expired');

    });

    it('Should take precedence over expireAfterAccess set globally', async () => {

        const cacheName = nextCacheName();
        const globalExpireAfterAccess = 50;
        const expireAfterAccess = 100;

        GlobalCacheConfig.set({expireAfterAccess: globalExpireAfterAccess});

        class Service {

            @Cacheable({cacheName, expireAfterAccess})
            findUser(): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;
        jasmine.clock().mockDate();
        await service.findUser().toPromise();
        jasmine.clock().tick(globalExpireAfterAccess + 1);

        expect(cache.get(generateCacheKey()) != null).toBeTruthy('Value must be present when entry is not expired');
        jasmine.clock().tick(expireAfterAccess + 1);
        expect(cache.get(generateCacheKey()) != null).toBeFalsy('Value must be absent when entry has expired');

    });

});
