import { cold, getTestScheduler } from 'jasmine-marbles';
import { defer, Observable, of, Subject, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { CacheableStream, CacheInvalidate, CacheUpdate, StorageFactory } from '../src';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1, user2, users } from './utils/user';

let frame = 0;

function nextFrame(callback?: () => void) {
    frame += 10;
    if (callback) {
        timer(frame, getTestScheduler()).subscribe(() => callback());
    }
}

describe('CachedStream >', () => {

    beforeEach(() => {
    });

    afterEach(() => {
        frame = 0;
    });

    it('Should open new stream and execute source observable once', async () => {

        const cacheName = nextCacheName();

        class Service {

            @CacheableStream(cacheName)
            getUser(): Observable<User> {
                return this.serverRequest(user1);
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When calling first time
        let result = await service.getUser().pipe(take(1)).toPromise();
        // Then serverRequest must be executed
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

        // When creating new subscriber
        result = await service.getUser().pipe(take(1)).toPromise();

        // Then serverRequest must not be executed again
        expect(result).toEqual(user1);
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

    });

    it('Should re-execute request when key changes', async () => {

        const cacheName = nextCacheName();

        class Service {

            @CacheableStream(cacheName)
            findUserById(id: number): Observable<User> {
                return this.serverRequest(users.find(user => user.id === id) || user1);
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        // When calling first time
        let result = await service.findUserById(1).pipe(take(1)).toPromise();
        // Then server request must be executed
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);
        expect(result).toEqual(user1);

        // When calling with same parameter
        await service.findUserById(1).pipe(take(1)).toPromise();
        // Then serverRequest must not be executed
        expect(serverRequestSpy).toHaveBeenCalledTimes(1);

        // When calling with different parameter
        result = await service.findUserById(2).pipe(take(1)).toPromise();
        // Then serverRequest must be executed again
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);
        expect(result).toEqual(user2);

    });

    it('Should return the same observable to all subscribers', async () => {

        const cacheName = nextCacheName();

        class Service {

            @CacheableStream(cacheName)
            getUser(): Observable<User> {
                return of(user1);
            }
        }

        const service = new Service();

        const obs = service.getUser();
        const obs2 = service.getUser();

        expect(obs).toBe(obs2);

    });

    it('Should restart original request when invalidated', async () => {

        const cacheName = nextCacheName();

        class Service {

            @CacheableStream(cacheName)
            getUser(): Observable<User> {
                return defer(() => {
                    return this.serverRequest(user1);
                });
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

            @CacheInvalidate(cacheName)
            invalidate(): Observable<any> {
                return of(true);
            }

            @CacheInvalidate({cacheName, all: true})
            invalidateAll(): Observable<any> {
                return of(true);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        const source = service.getUser().pipe(take(3));

        nextFrame();
        nextFrame(() => service.invalidate().subscribe());
        nextFrame();
        nextFrame(() => service.invalidateAll().subscribe());

        const expected = cold('a-b-(c|)', {a: user1, b: user1, c: user1});

        expect(source).toBeObservable(expected);
        expect(serverRequestSpy).toHaveBeenCalledTimes(3);

    });

    it('Should receive a new value when updated', async () => {

        const cacheName = nextCacheName();

        class Service {

            @CacheableStream(cacheName)
            getUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate(cacheName)
            update(): Observable<User> {
                return of(user2);
            }

        }

        const service = new Service();

        const source = service.getUser().pipe(take(2));

        nextFrame();
        nextFrame(() => service.update().subscribe());

        const expected = cold('a-(b|)', {a: user1, b: user2});

        expect(source).toBeObservable(expected);

    });

    it('Should emit loading events', async () => {

        const loading = new Subject<boolean>();
        const cacheName = nextCacheName();

        class Service {

            @CacheableStream({cacheName, loadingListener: loading})
            getUser(): Observable<User> {
                return timer(10, getTestScheduler()).pipe(map(() => user1));
            }

            @CacheInvalidate(cacheName)
            invalidate(): Observable<any> {
                return of(true);
            }

        }

        const service = new Service();

        const source = loading.pipe(take(4));

        nextFrame(() => service.getUser().subscribe());
        nextFrame();
        nextFrame();
        nextFrame(() => service.invalidate().subscribe());

        const expected = cold('-ab-c(d|)', {a: true, b: false, c: true, d: false});
        // const expected = cold('-ab-c|', {a: true, b: false, c: true, d: false});

        expect(source).toBeObservable(expected);

    });

    it('Should restart original request when receives signal from refreshOn', async () => {

        const invalidator = new Subject<void>();
        const cacheName = nextCacheName();

        class Service {

            @CacheableStream({cacheName, invalidateOn: invalidator})
            getUser(): Observable<User> {
                return defer(() => this.serverRequest(user1));
            }

            serverRequest(user: User): Observable<User> {
                return of(user);
            }

        }

        const service = new Service();
        const serverRequestSpy = spyOn(service, 'serverRequest').and.callThrough();

        const source = service.getUser().pipe(take(2));

        nextFrame(); // 10ms
        nextFrame(() => invalidator.next()); // 20ms

        const expected = cold('a-(b|)', {a: user1, b: user1});

        expect(source).toBeObservable(expected);
        expect(serverRequestSpy).toHaveBeenCalledTimes(2);

    });

    it('Should not emit cached value when another request is in progress', async () => {

        const cacheName = nextCacheName();

        class Service {

            @CacheableStream(cacheName)
            findUserById(id: number): Observable<User> {
                return timer(10).pipe(map(() => users.find(user => user.id === id) || user1));
            }

            @CacheInvalidate(cacheName)
            invalidate(): Observable<any> {
                return of(true);
            }

        }

        const service = new Service();

        let result = await service.findUserById(1).pipe(take(1)).toPromise();
        expect(result).toEqual(user1);

        // When cache is invalidated(refreshed)
        await service.invalidate().toPromise();

        // Then we should not receive user1 but wait for user2 instead
        result = await service.findUserById(2).pipe(take(1)).toPromise();

        expect(result).toEqual(user2);

    });

    it('Should store value to browser local storage', async () => {

        const cacheName = nextCacheName();

        const storageKeyPrefix = 'test';

        class Service {

            @CacheableStream({cacheName, storageFactory: StorageFactory.browserLocalStorage({storageKeyPrefix})})
            findUser(): Observable<User> {
                return of(user1);
            }
        }

        const service = new Service();

        let result = await service.findUser().pipe(take(1)).toPromise();
        expect(result).toEqual(user1);

        class Service2 {

            @CacheableStream({cacheName, storageFactory: StorageFactory.browserLocalStorage({storageKeyPrefix})})
            findUser(): Observable<User> {
                return this.serverRequest();
            }

            serverRequest(): Observable<User> {
                return of(user2);
            }
        }

        const service2 = new Service2();

        // Then we should not receive user1 but wait for user2 instead
        result = await service2.findUser().pipe(take(1)).toPromise();

        expect(result).toEqual(user1);

    });

});

