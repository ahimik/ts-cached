import { Observable, of, Subject } from 'rxjs';
import { Cacheable, CacheInvalidate, CacheUpdate } from '../src';
import { CacheManager } from '../src/cache/cache.manager';
import { DEFAULT_GLOBAL_CACHE_CONFIG } from '../src/cache/config/default-global-cache.config';
import { GlobalCacheConfig } from '../src';
import { VOID } from '../src/types/void';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1, user2, user3 } from './utils/user';

describe('Cache Invalidate >', () => {

    beforeEach(() => {
        GlobalCacheConfig.set(DEFAULT_GLOBAL_CACHE_CONFIG);
    });

    afterEach(() => {
        CacheManager.getAllCaches().forEach(cache => cache.invalidateAll());
    });

    it('Should find and invalidate cache within the same class', async () => {

        class Service {

            @Cacheable()
            findUser(): Observable<User> {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

            @CacheInvalidate()
            invalidate(): Observable<any> {
                return of(true);
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

        await service.invalidate().toPromise();

        // When calling after cache invalidated
        result = await service.findUser().toPromise();
        // Then original method must be executed again
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should invalidate cache by promise', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

            @CacheInvalidate(cacheName)
            invalidate(): Promise<any> {
                return Promise.resolve(true);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();
        const cache = CacheManager.getCache(cacheName);

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

        expect(cache?.getEntries().length).toEqual(1);

        await service.invalidate();

        expect(cache?.getEntries().length).toEqual(0);

        // When calling after cache invalidated
        result = await service.findUser().toPromise();
        // Then original method must be executed again
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should invalidate cache by synchronous function call', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

            @CacheInvalidate(cacheName)
            invalidate(): boolean {
                return true;
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();
        const cache = CacheManager.getCache(cacheName);

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

        expect(cache?.getEntries().length).toEqual(1);

        service.invalidate();

        expect(cache?.getEntries().length).toEqual(0);

        // When calling after cache invalidated
        result = await service.findUser().toPromise();
        // Then original method must be executed again
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should invalidate multiple caches at once', async () => {

        const cacheName = nextCacheName();
        const cacheName2 = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @Cacheable(cacheName2)
            findUser2(): Observable<User> {
                return of(user2);
            }

            @CacheInvalidate([cacheName, cacheName2])
            invalidate(): Promise<any> {
                return Promise.resolve(true);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName);
        const cache2 = CacheManager.getCache(cacheName2);

        let result = await service.findUser().toPromise();
        expect(result).toEqual(user1);

        result = await service.findUser2().toPromise();
        expect(result).toEqual(user2);

        expect(cache?.getEntries().length).toEqual(1);
        expect(cache2?.getEntries().length).toEqual(1);

        await service.invalidate();

        expect(cache?.getEntries().length).toEqual(0);
        expect(cache2?.getEntries().length).toEqual(0);

    });

    it('Should invalidate all cache entries when parameter "all" is set to "true"', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(id: number): Observable<User> {
                return of(user1);
            }

            @CacheInvalidate({all: true})
            invalidateAll(): Observable<any> {
                return of(true);
            }

        }

        const service = new Service();
        const cache = CacheManager.getCache(cacheName);

        // When caching by different parameters
        await service.findUser(1).toPromise();
        await service.findUser(2).toPromise();
        await service.findUser(3).toPromise();
        // Then 3 values must be cached
        expect(cache?.getEntries().length).toEqual(3);

        // When invalidating all entries
        await service.invalidateAll().toPromise();
        // Then all values must be invalidated
        expect(cache?.getEntries().length).toEqual(0);

    });

    it('Should invalidate cache when dependent cache gets invalidated', async () => {

        const cacheName = nextCacheName();
        const cacheName2 = nextCacheName();

        class Service {

            @Cacheable(cacheName) // Parent cache
            findUser(): Observable<User> {
                return of(user1);
            }

            @Cacheable({
                cacheName: cacheName2,
                invalidateOn: cacheName // Invalidate cache when dependent cache gets invalidated
            })
            findUser2(): Observable<User> {
                return this.serverRequest();
            }

            serverRequest(): Observable<User> {
                return of(user2);
            }

            @CacheInvalidate(cacheName)
            invalidateUser(): void {
                return VOID;
            }

        }

        const service = new Service();

        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When working with dependent cache
        await service.findUser().toPromise();
        // Then current cache request should not be called
        expect(serverRequestSpy).not.toHaveBeenCalled();
        // When working with current cache
        await service.findUser2().toPromise();
        // Then server request should be sent since value is missing in the cache
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);
        // When calling method second time
        await service.findUser2().toPromise();
        // Then value from cache should be retrieved
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);
        // When invalidating dependent cache
        await service.invalidateUser();
        // And calling current cache method again
        await service.findUser2().toPromise();
        // Then server request should be sent since current cache must have been invalidated by cascade
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should invalidate cache when dependent cache gets updated', async () => {

        const cacheName = nextCacheName();
        const cacheName2 = nextCacheName();

        class Service {

            @Cacheable(cacheName) // Parent cache
            findUser(): Observable<User> {
                return of(user1);
            }

            @Cacheable({
                cacheName: cacheName2,
                invalidateOn: cacheName // Invalidate cache when dependent cache gets invalidated
            })
            findUser2(): Observable<User> {
                return this.serverRequest();
            }

            serverRequest(): Observable<User> {
                return of(user2);
            }

            @CacheUpdate(cacheName)
            updateUser(): User {
                return user3;
            }

        }

        const service = new Service();

        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When working with dependent cache
        await service.findUser().toPromise();
        // Then current cache request should not be called
        expect(serverRequestSpy).not.toHaveBeenCalled();
        // When working with current cache
        await service.findUser2().toPromise();
        // Then server request should be sent since value is missing in the cache
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);
        // When calling method second time
        await service.findUser2().toPromise();
        // Then value from cache should be retrieved
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);
        // When dependent cache is updated
        service.updateUser();
        // And current cache method is called again
        await service.findUser2().toPromise();
        // Then server request should be sent since current cache must have been invalidated by cascade
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should invalidate cache when invalidation signal is received from observable', async () => {

        const cacheName = nextCacheName();

        const invalidateSignalEmitter = new Subject<void>();

        class Service {

            @Cacheable({cacheName, invalidateOn: invalidateSignalEmitter})
            findUser(): Observable<User> {
                return this.serverRequest();
            }

            serverRequest(): Observable<User> {
                return of(user1);
            }

        }

        const service = new Service();

        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When working with cache
        await service.findUser().toPromise();
        // Then server request should be sent since value is missing in the cache
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);
        // When calling method second time
        await service.findUser().toPromise();
        // Then value from cache should be retrieved
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

        // When invalidation signal is sent
        invalidateSignalEmitter.next();
        // And calling current cache method again
        await service.findUser().toPromise();
        // Then server request should be sent since cache must have been invalidated
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

});
