import { Observable, of, Subject } from 'rxjs';
import { Cacheable, CacheInvalidate, CacheUpdate, GlobalCacheConfig, InvalidationInfo, UpdateInfo } from '../src';
import { VOID } from '../src/types/void';
import { generateCacheKey } from './utils/cache-key.generator';
import { nextCacheName } from './utils/cache-name.generator';
import { User, user1, user2, user3 } from './utils/user';

describe('Cache Listeners >', () => {

    beforeEach(() => {
        GlobalCacheConfig.resetToDefaults();
    });

    afterEach(() => {
    });

    // it('Should execute cache listener when cache get updated', async () => {
    //
    //     const cacheName = nextCacheName();
    //     const cacheName2 = nextCacheName();
    //
    //     class ListenerService {
    //
    //         listener(info: UpdateInfo<User>): void {
    //             return VOID;
    //         }
    //
    //     }
    //
    //     const listenerService = new ListenerService();
    //
    //     const listenerSpy = spyOn(listenerService, 'listener').and.callThrough();
    //
    //     const asyncListener = new Subject();
    //
    //     const asyncListenerSpy = spyOn(asyncListener, 'next');
    //
    //     class Service {
    //
    //         @Cacheable({cacheName, updateListener: listenerSpy})
    //         findUser(): Observable<User> {
    //             return of(user1);
    //         }
    //
    //         @CacheUpdate(cacheName)
    //         updateUser(): Observable<User> {
    //             return of(user2);
    //         }
    //
    //         @Cacheable({cacheName: cacheName2, updateListener: asyncListenerSpy})
    //         findUserAsyncListener(): Observable<User> {
    //             return of(user3);
    //         }
    //
    //     }
    //
    //     const service = new Service();
    //
    //     // When calling cache load method
    //     await service.findUser().toPromise();
    //     // Then listener should be called
    //     expect(listenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), value: user1});
    //
    //     // When calling cache update method
    //     await service.updateUser().toPromise();
    //     // Then listener should be called
    //     expect(listenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), value: user2});
    //
    //     // When calling cache update method with async listener
    //     await service.findUserAsyncListener().toPromise();
    //     // Then asynchronous listener should be called
    //     expect(asyncListenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), value: user3});
    //
    // });
    //
    // it('Should execute cache listener when cache gets invalidated', async () => {
    //
    //     const cacheName = nextCacheName();
    //     const cacheName2 = nextCacheName();
    //
    //     class ListenerService {
    //
    //         listener(info: InvalidationInfo): void {
    //             return VOID;
    //         }
    //
    //     }
    //
    //     const listenerService = new ListenerService();
    //
    //     const listenerSpy = spyOn(listenerService, 'listener').and.callThrough();
    //
    //     const asyncListener = new Subject();
    //
    //     const asyncListenerSpy = spyOn(asyncListener, 'next');
    //
    //     class Service {
    //
    //         @Cacheable({cacheName, invalidateListener: listenerSpy})
    //         findUser(): Observable<User> {
    //             return of(user1);
    //         }
    //
    //         @CacheInvalidate(cacheName)
    //         invalidateUser(): void {
    //             return VOID;
    //         }
    //
    //         @CacheInvalidate({cacheName, all: true})
    //         invalidateUserAll(): void {
    //             return VOID;
    //         }
    //
    //         @Cacheable({cacheName: cacheName2, invalidateListener: asyncListenerSpy})
    //         findUserAsyncListener(): Observable<User> {
    //             return of(user3);
    //         }
    //
    //         @CacheInvalidate(cacheName2)
    //         invalidateUserAsyncListener(): void {
    //             return VOID;
    //         }
    //
    //         @CacheInvalidate({cacheName: cacheName2, all: true})
    //         invalidateUserAsyncListenerAll(): void {
    //             return VOID;
    //         }
    //
    //     }
    //
    //     const service = new Service();
    //
    //     // When calling cache load method
    //     await service.findUser().toPromise();
    //     // Then invalidate listener should not be called
    //     expect(listenerSpy).not.toHaveBeenCalled();
    //     // When invalidating the cache
    //     service.invalidateUser();
    //     // Then invalidate listener should be called
    //     expect(listenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), all: false});
    //     // When invalidating the cache with all = true
    //     service.invalidateUserAll();
    //     // Then invalidate listener should be called with "all" parameter
    //     expect(listenerSpy).toHaveBeenCalledWith({key: undefined, all: true});
    //
    //     // When calling cache load method
    //     await service.findUserAsyncListener().toPromise();
    //     // Then invalidate async listener should not be called
    //     expect(asyncListenerSpy).not.toHaveBeenCalled();
    //     // When invalidating the cache
    //     service.invalidateUserAsyncListener();
    //     // Then invalidate async listener should be called
    //     expect(asyncListenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), all: false});
    //     // When invalidating the cache with all = true
    //     service.invalidateUserAsyncListenerAll();
    //     // Then invalidate async  listener should be called with "all" parameter
    //     expect(asyncListenerSpy).toHaveBeenCalledWith({key: undefined, all: true});
    //
    // });

    it('Should execute listener for @CacheInvalidate decorator', async () => {

        const cacheName = nextCacheName();

        class ListenerService {

            listener(info: InvalidationInfo): void {
            }

        }

        const listenerService = new ListenerService();

        const listenerSpy = spyOn(listenerService, 'listener').and.callThrough();

        const asyncListener = new Subject<InvalidationInfo>();

        const asyncListenerSpy = spyOn(asyncListener, 'next');

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @CacheInvalidate({cacheName, listener: listenerSpy})
            invalidateUser(): Promise<void> {
                return Promise.resolve(VOID);
            }

            @CacheInvalidate({cacheName, listener: listenerSpy, all: true})
            invalidateUserAll(): Promise<void> {
                return Promise.resolve(VOID);
            }

            @CacheInvalidate({cacheName, listener: asyncListener})
            invalidateAsyncListener(): void {
                return VOID;
            }

        }

        const service = new Service();

        // When value is cached
        await service.findUser().toPromise();
        // And cache is invalidated
        await service.invalidateUser();
        // Then listener should be called
        expect(listenerSpy).toHaveBeenCalledWith({key: generateCacheKey()});
        // When cache is invalidated with all = true
        await service.invalidateUserAll();
        // Then listener should be called
        expect(listenerSpy).toHaveBeenCalledWith({all: true});

        // When cache is invalidated
        service.invalidateAsyncListener();
        // Then async listener should be called
        expect(asyncListenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), all: undefined});

    });

    it('Should execute listener for @CacheUpdate decorator', async () => {

        const cacheName = nextCacheName();

        class ListenerService {

            listener(info: UpdateInfo<User>): void {
            }

        }

        const listenerService = new ListenerService();

        const listenerSpy = spyOn(listenerService, 'listener').and.callThrough();

        const asyncListener = new Subject<UpdateInfo<User>>();

        const asyncListenerSpy = spyOn(asyncListener, 'next');

        class Service {

            @Cacheable(cacheName)
            findUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate({cacheName, listener: listenerSpy})
            updateUser(): Observable<User> {
                return of(user1);
            }

            @CacheUpdate({cacheName, listener: asyncListener})
            updateUserAsyncListener(): Observable<User> {
                return of(user2);
            }

            @CacheUpdate({cacheName, listener: listenerSpy})
            updateUserSync(): User {
                return user3;
            }

        }

        const service = new Service();

        // When calling cache update method
        await service.updateUser().toPromise();
        // Then listener should be called
        expect(listenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), value: user1});

        // When calling cache update method
        service.updateUserSync();
        expect(listenerSpy).toHaveBeenCalledTimes(2);
        // Then listener should be called
        expect(listenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), value: user1});

        // When calling cache update method with async listener
        await service.updateUserAsyncListener().toPromise();
        // Then asynchronous listener should be called
        expect(asyncListenerSpy).toHaveBeenCalledWith({key: generateCacheKey(), value: user2});

    });

});

