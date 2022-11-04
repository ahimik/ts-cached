import { defer, Observable, of } from 'rxjs';
import { Cacheable, CacheUpdate, GlobalCacheConfig } from '../src';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1, user2, user3 } from './utils/user';

describe('Cache Update >', () => {

    beforeEach(() => {
        GlobalCacheConfig.resetToDefaults();
    });

    afterEach(() => {
    });

    it('Should always execute original cache update method', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            updateUser(): Observable<User> {
                return this.updateRequest(user2);
            }

            updateRequest(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const updateRequestSpy = spyOn(service, 'updateUser').and.callThrough();

        // The original method must be executed on each call
        let result = await service.updateUser().toPromise();
        expect(result).toEqual(user2);
        expect(updateRequestSpy).toHaveBeenCalledTimes(1);
        result = await service.updateUser().toPromise();
        expect(result).toEqual(user2);
        expect(updateRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should update cache by Observable', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            updateUser(): Observable<User> {
                return of(user2);
            }

        }

        const service = new Service();

        // When calling cached method
        let result = await service.findUser().toPromise();
        // Then user1 must be returned
        expect(result).toEqual(user1);
        // When calling cache update method
        result = await service.updateUser().toPromise();
        // Then user2 must be returned
        expect(result).toEqual(user2);
        // When calling cached method again
        result = await service.findUser().toPromise();
        // Then user2 must be returned since cache was updated with user2
        expect(result).toEqual(user2);
    });

    it('Should join cache update operation', async done => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return defer(() => this.serverRequest());
            }

            serverRequest(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            updateUser(): Observable<User> {
                return of(user2);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();
        // When updating cache
        service.updateUser().subscribe(() => done());
        // When getting user during cache update is in progress
        const result = await service.findUser().toPromise();
        // Then updated user should be returned
        expect(result).toEqual(user2);
        // And server request should not have been called
        expect(serverRequestSpy).not.toHaveBeenCalled();

    });

    it('Should update cache by Promise', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            updateUser(): Promise<User> {
                return Promise.resolve(user2);
            }

        }

        const service = new Service();

        // When calling cache update method
        let result: User | undefined = await service.updateUser();
        // Then user2 must be returned
        expect(result).toEqual(user2);
        // When calling cached method again
        result = await service.findUser().toPromise();
        // Then user2 must be returned since cache was updated with user2
        expect(result).toEqual(user2);
    });

    it('Should update cache by synchronous function call', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            updateUser(): User {
                return user2;
            }

        }

        const service = new Service();

        // When calling cache update method
        let result: User | undefined = service.updateUser();
        // Then user2 must be returned
        expect(result).toEqual(user2);
        // When calling cached method again
        result = await service.findUser().toPromise();
        // Then user2 must be returned since cache was updated with user2
        expect(result).toEqual(user2);
    });

    it('Should update multiple caches at once', async () => {

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

            @CacheUpdate([cacheName, cacheName2])
            updateUser(): Observable<User> {
                return of(user3);
            }

        }

        const service = new Service();

        // When calling cache update method
        let result = await service.updateUser().toPromise();
        // Then user3 must be returned
        expect(result).toEqual(user3);
        // When calling cached method
        result = await service.findUser().toPromise();
        // Then user3 must be returned since cache was updated with user3
        expect(result).toEqual(user3);
        // When calling another cached method
        result = await service.findUser2().toPromise();
        // Then user3 must be returned since cache was updated with user3
        expect(result).toEqual(user3);

    });

    it('Should update cache conditionally according to specified filter', async () => {

        const cacheName = nextCacheName();

        class Service {

            @Cacheable(cacheName)
            findUser(id: number): Observable<User> {
                return of(user1);
            }

            @CacheUpdate({cacheName, filter: id => id % 2 === 0})
            updateUser(id: number): Observable<User> {
                return of(user2);
            }

        }

        const service = new Service();

        // When updating value for odd id number
        await service.updateUser(1).toPromise();
        // Then value should not be updated
        let result = await service.findUser(1).toPromise();
        expect(result).toEqual(user1);

        // When updating for even id number
        await service.updateUser(2).toPromise();
        // Then value should be updated
        result = await service.findUser(2).toPromise();
        expect(result).toEqual(user2);

    });

});
