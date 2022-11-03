import { defer, forkJoin, Observable, of, throwError } from 'rxjs';
import { Cacheable, CacheParam, CacheParamIgnore, GlobalCacheConfig } from '../src';
import { CacheManager } from '../src/cache/cache.manager';
import { DEFAULT_GLOBAL_CACHE_CONFIG } from '../src/cache/config/default-global-cache.config';
import { CacheKey } from '../src/cache/model/cache-key';
import { generateCacheKey } from './utils/cache-key.generator';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1 } from './utils/user';

describe('Cache >', () => {

    beforeEach(() => {
        GlobalCacheConfig.set(DEFAULT_GLOBAL_CACHE_CONFIG);
    });

    afterEach(() => {
        CacheManager.getAllCaches().forEach(cache => cache.invalidateAll());
    });

    it('Should cache observable result', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When calling first time
        let result = await service.findUser().toPromise();
        // Then original method must be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

        // When calling second time
        result = await service.findUser().toPromise();
        // Then original method must not be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

    });

    it('Should cache promise result', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Promise<User> {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): Promise<User> {
                return Promise.resolve(user);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When calling first time
        let result = await service.findUser();
        // Then original method must be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

        // When calling second time
        result = await service.findUser();
        // Then original method must not be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

    });

    it('Should cache value', () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): User {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): User {
                return user;
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When calling first time
        let result = service.findUser();
        // Then original method must be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

        // When calling second time
        result = service.findUser();
        // Then original method must not be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

    });

    it('Should build cache key of all parameters by default', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(key1: number, key2: string, key3: object): Observable<User> {
                return of(user1);
            }
        }

        const service = new Service();

        const param1 = 1;
        const param2 = '2';
        const param3 = {param3: 3};

        await service.findUser(param1, param2, param3).toPromise();

        const cacheEntry = CacheManager.getCache(cacheName)?.getEntries()[0];
        expect(cacheEntry?.key).toEqual(generateCacheKey(param1, param2, param3));

    });

    it('Should include specified parameters into cache key', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable({cacheName})
            findByMultipleParameters(@CacheParam() p1: number, p2: number, @CacheParam() p3: number): Observable<User> {
                return of(user1);
            }

        }

        const param1 = 1;
        const param2 = 2;
        const param3 = 3;
        const service = new Service();
        await service.findByMultipleParameters(param1, param2, param3).toPromise();

        const cache = CacheManager.getCache(cacheName);
        const entry = cache?.getEntries()[0];

        expect(entry?.key).toEqual(generateCacheKey(param1, param3));

    });

    it('Should ignore specified parameters from cache key', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable({cacheName})
            findByMultipleParameters(@CacheParamIgnore() p1: number, p2: number, @CacheParamIgnore() p3: number): Observable<User> {
                return of(user1);
            }

        }

        const param1 = 1;
        const param2 = 2;
        const param3 = 3;
        const service = new Service();
        await service.findByMultipleParameters(param1, param2, param3).toPromise();

        const cache = CacheManager.getCache(cacheName);
        const entry = cache?.getEntries()[0];

        expect(entry?.key).toEqual(generateCacheKey(param2));

    });

    it('Should use included cache params if both included and ignored are specified', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable({cacheName})
            findByMultipleParameters(@CacheParamIgnore() p1: number, @CacheParam() p2: number, p3: number): Observable<User> {
                return of(user1);
            }

        }

        const param1 = 1;
        const param2 = 2;
        const param3 = 3;
        const service = new Service();
        await service.findByMultipleParameters(param1, param2, param3).toPromise();

        const cache = CacheManager.getCache(cacheName);
        const entry = cache?.getEntries()[0];

        expect(entry?.key).toEqual(generateCacheKey(param2));

    });

    it('Should extract cache key parameter from object using mapping function', async () => {

        const cacheName = nextCacheName();

        interface CompoundObject {
            nested: {
                name: string;
            };
        }

        class Service {

            @Cacheable(cacheName)
            findUser(@CacheParam(obj => obj.nested.name) p1: CompoundObject): Observable<User> {
                return of(user1);
            }

        }

        const paramName = 'test';
        const param: CompoundObject = {
            nested: {
                name: paramName
            }
        };
        const service = new Service();
        await service.findUser(param).toPromise();

        const cache = CacheManager.getCache(cacheName);
        const entry = cache?.getEntries()[0];

        expect(entry?.key).toEqual(generateCacheKey(paramName));

    });

    it('Should use custom cache key generator', async () => {

        const cacheName = nextCacheName();

        const customKey = 'customKey';

        const param1 = 'param1';
        const param2 = 2;

        class KeyGenerator {

            generate(...args: any[]): CacheKey {
                return customKey;
            }

        }

        const keyGeneratorSpy = spyOn(new KeyGenerator(), 'generate').and.callThrough();

        class Service {

            @Cacheable({cacheName, keyGenerator: keyGeneratorSpy})
            findUser(p1: string, p2: number): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        // When original method is called with param1 and param2
        await service.findUser(param1, param2).toPromise();

        // Then custom key generator should be called with the same parameter values
        expect(keyGeneratorSpy).toHaveBeenCalledWith(param1, param2);

        const cache = CacheManager.getCache(cacheName);
        const entry = cache?.getEntries()[0];

        // And key must be equal to generated customKey
        expect(entry?.key).toEqual(customKey);

    });

    it('Should not fail when original observable fails with error', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(fail: boolean): Observable<User> {
                if (fail) {
                    return throwError(new Error('test'));
                } else {
                    return of(user1);
                }
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName);
        try {
            await service.findUser(true).toPromise();
        } catch (err) {
            expect(err).toBeDefined();
        }
        expect(cache?.getEntries().length).toEqual(0);
        const result = await service.findUser(false).toPromise();
        expect(result).toEqual(user1);
        expect(cache?.getEntries().length).toEqual(1);

    });

    it('Should Join cache requests', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return defer(() => this.serverRequest(user1));
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        forkJoin([service.findUser(), service.findUser(), service.findUser()]).subscribe();
        service.findUser().subscribe();
        service.findUser().subscribe();
        service.findUser().subscribe();
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

    });

    it('Should apply conditional caching according to specified filter', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable({cacheName, filter: id => id % 2 === 0})
            findUser(id: number): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName)!;

        // When calling with odd number
        await service.findUser(1).toPromise();
        // Then value should not be cached
        expect(cache.getEntries().length).toEqual(0);
        // When calling with even number
        await service.findUser(2).toPromise();
        // Then value should be cached
        expect(cache.getEntries().length).toEqual(1);

    });

    it('Should cache null values by default', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User | null> {
                return defer(() => this.serverRequest());
            }

            serverRequest(): Observable<User | null> {
                return of(null);
            }

        }

        const service = new Service();

        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        const cache = CacheManager.getCache(cacheName)!;

        // When null value is returned
        await service.findUser().toPromise();
        // Then it should be cached
        expect(cache.getEntries().length).toEqual(1);
        // When calling method second time
        await service.findUser().toPromise();
        // Then value from cache should be returned
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

    });

    it('Should apply conditional caching based on unless condition', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable({cacheName, unless: user => user != null})
            findUser(): Observable<User | null> {
                return defer(() => this.serverRequest());
            }

            serverRequest(): Observable<User | null> {
                return of(null);
            }

        }

        const service = new Service();

        const cache = CacheManager.getCache(cacheName)!;

        // When null value is returned
        await service.findUser().toPromise();
        // Then it should not be cached
        expect(cache.getEntries().length).toEqual(0);

    });

    describe('Validation >', () => {

        beforeEach(() => {
            GlobalCacheConfig.set(DEFAULT_GLOBAL_CACHE_CONFIG);
            jasmine.clock().uninstall();
            jasmine.clock().install();
        });

        afterEach(() => {
            CacheManager.getAllCaches().forEach(cache => cache.invalidateAll());
            jasmine.clock().uninstall();
        });

        it('Should delete expired entry when expireAfterWrite is set', async () => {

            const cacheName = nextCacheName();
            const expireAfterWrite = 100;

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

            jasmine.clock().tick(expireAfterWrite);
            expect(cache.get(generateCacheKey()) != null).toBeTruthy();

            jasmine.clock().tick(1);
            expect(cache.get(generateCacheKey()) != null).toBeFalsy();

        });

        it('Should delete expired entry when expireAfterAccess is set', async () => {

            const cacheName = nextCacheName();
            const expireAfterAccess = 100;

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

            // When ticks less or equal expireAfterAccess
            jasmine.clock().tick(expireAfterAccess);
            // Accessing entries refreshes accessTime
            expect(cache.get(generateCacheKey()) != null).toBeTruthy();

            jasmine.clock().tick(expireAfterAccess);
            expect(cache.get(generateCacheKey()) != null).toBeTruthy();

            // When ticks more than expireAfterAccess time
            jasmine.clock().tick(expireAfterAccess + 1);
            // Then the value gets deleted
            expect(cache.get(generateCacheKey()) != null).toBeFalsy();

        });

    });

});

