# ts-cache

A simple yet powerful type agnostic caching library based on typescript decorators.
The library supports asynchronous types such as Promise and Observable as well
as regular synchronous function calls. There are few simple steps required
to begin with a common caching scenario, however it is flexible enough for advanced usage.

Main benefits:
- Simple declarative usage
- Type agnostic
- Requests joining
- Flexible and configurable

## Installing

Run `npm i ts-cache` to install the library into your project via NPM.

## Getting started

Simply put `@Cacheable()` decorator on a method which requires caching:

```ts
class UserService {

    @Cacheable() // Declares user cache.
    findUserById(id: string): Observable<User> {
        return this.httpClient.get<User>('/user');
    }

    @CacheInvalidate() // Invalidates cached user for the given id once observable is completed.
    invalidateUser(id: string): Observable<void> {
        return this.httpClient.post<void>('/user/doSomethingWhichAffectsUser', {});
    }

    @CacheInvalidate({all: true}) // Invalidates all user cache entries.
    invalidateAllUsers(): Observable<void> {
        return this.httpClient.post<void>('/user/doSomethingWhichAffectsAllUsers', {});
    }

    @CacheUpdate() // Updates user cache for the given id with the value returned by observable. Never skups the original method call.
    updateUser(@CacheParam() id: string, user: User): Observable<User> { // Ignore user parameter to conform with @Cacheable() method params
        return this.httpClient.post<User>('/user/update', user);
    }

}
```

You can apply `@Cacheable` decorator to a method which returns `Promise` or direct `User` object as well:

```ts
class UserService {

    @Cacheable()
    getUser(): Promise<User> {
        return this.httpClient.get<User>('/user').toPromise();
    }

    @Cacheable()
    createUser(): User {
        // ...some expensive calculations...
        return new User();
    }

}
```

**Note:** 
Cache decorator needs to run the original method at least once in order to determine function return type.

For automatic return type resolution you can install `npm i reflect-metadata` package
and set `emitDecoratorMetadata: true` option in your `tsconfig.json`.
Then at the first line of your application import the installed package: 
```
import 'reflect-metadata';
```
This will save excessive original function calls in some edge cases, however this is not required.

### Multiple caches within the same class 

You can specify as many caches as you need. Each `@Cacheable()` decorator declares a new cache instance:

```ts
class UserService {

    @Cacheable() // Cache of users
    findUser(): Observable<User> {
        return this.httpClient.get<User>('/user');
    }

    @Cacheable() // Cache of countries
    listCountries(): Observable<Country[]> {
        return this.httpClient.get<Country[]>('/countries');
    }
    
}
```

It's recommended to assign cache names in order to identify your caches:

```ts
const USER_CACHE = 'UserCache';
const COUNTRY_CACHE = 'CountryCache';

class UserService {

    @Cacheable(USER_CACHE) // Cache of users
    findUser(): Observable<User> {
        return this.httpClient.get<User>('/user');
    }

    @Cacheable(COUNTRY_CACHE) // Cache of countries
    listCountries(): Observable<Country[]> {
        return this.httpClient.get<Country[]>('/countries');
    }
    
}
```

## Cache parameters

Cache key is built of all method arguments by default. However, you can explicitly specify method
arguments which should be included into a cache key using `@CacheParam()` decorator like this:

```ts
import { CacheParam } from 'ts-cache';

class UserService {

    @Cacheable()
    findUserById( /* #1 */ @CacheParam() id: string, remote: boolean): Observable<User> {
        return this.httpClient.get<User>(`/user/${id}`);
    }

}
```

`#1` - specifies that only the first method parameter must be included into a cache key.

You can also map the parameter value if needed:

```ts
class UserService {

    @Cacheable()
    findUserByObject(@CacheParam(object => object.id) object: {id: string}): Observable<User> {
        return this.httpClient.get<User>(`/user/${object.nested.id}`);
    }
    
}
```

`@CacheParam(object => object.nested.id)` - specifies that cache key must be build of `id` property extracted from object.

## Conditional value caching

By default, the library cache `null` and does not cache `undefined` values. `undefined` is the reserved value type
which internally means there is no value in cache.

You can omit caching `null` as well by explicitly defining `unless` condition:

```ts
class UserService {

    @Cacheable({unless: user => user != null}) // null value won't be cached
    getUser(): Observable<User | null> {
        return this.httpClient.get<User | null>(`/user`);
    }
    
}
```

## Cache configuration

`@Cacheable()` decorator function takes the following configuration:

```
cacheName?: string - the name of the cache.

maxSize?: number - Maximum number of cache entries. The oldest cache entry will be deleted automatically once maximum size is exceeded.

expireAfterWrite?: number - Max time within which the entry is valid after being added to cache.

expireAfterAccess?: number - Max time within which the entry is valid after being last read from cache.

storageFactory?: (cacheName: string) => SyncStorage<E> - Storage factory function.
You can use one of the pre-built options:

- StorageFactory.inMemoryStorage() // Creates new in-memory cache storage
- StorageFactory.browserLocalStorage() // Creates new cache storage which persists cache to browser local storage
 
,or create your own storage by implementing `SyncStorage` interface.

filter?: (...args: any[]) => boolean - a predicate that allows you to cache conditionally based on passed method arguments' values.

keyGenerator?: (..args: any[]) => string - custom key generator function which takes all included cache parameters and must return cache key as a string.

invalidateOn?: Observable<any> | string | Array<string | Observable<any>> - cache invalidation source. 
It can be an observable(s) or a cache name(s).
If observable is provided all cache entries get invalidated on each emitted value received from observable.
If cache name is provided, current cache gets invalidated completely when dependent cache(s) is updated or invalidated.

unless?: (value) => boolean - function which allows to cache values conditionally. For example you can omit caching nulls by specifying:
"(value) => value !== null" - which basically means: "cache values unless it's not a null value"
 
```

## Cache Invalidation

There are multiple ways to invalidate cache and the simplest one is to use `@CacheInvalidate()` decorator:

```ts
class UserService {

    @Cacheable() // Declares user cache
    findUserById(id: string): Observable<User> {
        return this.httpClient.get<User>(`/user/${id}`);
    }

    @CacheInvalidate() // Invalidated user cache once observable is completed
    invalidateUser(id: string): Observable<void> {
        return timer(1000);
    }

}
```

User cache will be invalidated for the given parameter value once observable returned by `invalidateUser()` is completed.
Unlike with `@Cacheable()` decorator the original method call is never skipped.

You can set `{all: true}` if you want to invalidate all cache entries at once regardless of method parameters' values:

```ts
class UserService {

    @Cacheable() // Declares user cache
    findUserById(id: string): Observable<User> {
        return this.httpClient.get<User>(`/user/${id}`);
    }

    @CacheInvalidate({all: true}) // Invalidates all entries in user cache
    invalidateUser(id: string): Observable<void> {
        return timer(1000);
    }

}
```

### Invalidate multiple caches

By default, `@CacheInvalidate()` decorator will invalidate all caches within the same class if cache name is not specified,
however you can explicitly specify cache(s) to invalidate:

```ts
class UserService {

    // ...
    
    @CacheInvalidate([USER_CACHE, COUNTRY_CACHE]) // This will invalidate both user and country caches once observable is completed
    invalidateUserAndCountries(): Observable<void> {
        return timer(1000);
    }

}
```

You can apply `@CacheInvalidate()` decorator to method which returns Promise or any other value as well:

```ts
class UserService {

    @CacheInvalidate(USER_CACHE)
    invalidateUserByPromise(): Promise<true> {
        return Promise.resolve(true);
    }

    @CacheInvalidate(USER_CACHE)
    invalidateUserSync(): void {
        // do something...
    }

}
```

You can also specify cache to be invalidated by observable:

```ts

const invalidateRequest = new Subject();

timer(1000).subscribe(() => {
    invalidateRequest.next(); // This will request the user cache to be invalidated.    
})

class UserService {

    @Cacheable({invalidateOn:  invalidateRequest.asObservable()}) // Invalidate user cache when any value is received from observable
    findUserById(id: string): Observable<User> {
        return this.httpClient.get<User>(`/user/${id}`);
    }

}
```

or by another cache:

```ts
const USER_CACHE = 'userCache';
const USER_ADRESSES_CACHE = 'userAdressesCache';

class UserService {

    @Cacheable(USER_CACHE)
    getUser(): Observable<User> {
        return this.httpClient.get<User>(`/user`);
    }

    @Cacheable({invalidateOn: USER_CACHE}) // Cache will be invalidated completely after "USER_CACHE" is updated or invalidated.
    listUserAdresses(): Observable<UserAddress[]> {
        return this.httpClient.get<UserAddress[]>(`/user/adresses`);
    }

}

```

`@CacheInvalidate()` decorator function takes the following configuration:

```
cacheName?: string | string[] - cache name(s) to invalidate.

all?: boolean - wthether to invalidate all cache entries regardless of a cache key value. 

filter?: (...args: any[]) => boolean - a predicate that allows you to conditionally invalidate cache based on the passed method arguments values at runtime

instant?: boolean - whether to invalidate cache instantly or when observable or promise is completed.

keyGenerator?: (..args: any[]) => string - custom key generator function which accepts all included cache parameters and must return cache key as a string

listerer?: Subject<InvalidateInfo> | (info: InvalidateInfo) => void - subject or callback function which gets executed once
operation is completed. 

```

## Updating Cache

Sometimes when you modify any value or object you want the value in cache to be updated with the new value directly
without making any extra server calls.
`@CacheUpdate()` decorator is dedicated to do so:

```ts
import { CacheParamIgnore } from './cache-param-ignore.decorator';

const USER_CACHE = 'userCache';

class UserService {

    @Cacheable(USER_CACHE) // #1
    getCurrentUser(): Observable<User> {
        return this.httpClient.get<User>(`/user`);
    }

    @CacheUpdate(USER_CACHE) // #2
    updateUser(/* #3 */ @CacheParamIgnore() user: User): Observable<User> /* #4 */ {
        return this.httpClient.post<User>(`/user`, user);
    }

}
```
`#1` - Declares user cache.

`#2` - Updates user cache.

`#3` - Since our cacheable method has no parameters we should ignore user object from cache key parameters as well.

`#4` - Return value must be of the same type as cacheable value.

You can put `@CacheUpdate()` on a method which returns Promise similar to `@CacheInvalidate()` decorator.

`@CacheUpdate()` decorator function takes the following configuration:

```
cacheName?: string | string[] - cache name(s) to be updated.

filter?: (...args: any[]) => boolean - a predicate allows you to conditionally update cache based on the actual method arguments values.

keyGenerator?: (..args: any[]) => string - custom key generator function which accepts all included cache parameters and must return cache key as a string value.

listerer?: Subject<UpdateInfo> | (info: UpdateInfo) => void - subject or callback function which gets executed once operation is completed. 

```

## Concurrent Cache Updates

Default cache implementation **joins** simultaneous identical cache updates:

```ts
class UserService {

    @Cacheable()
    findUser(): Observable<User> {
        return this.httpClient.get<User>(`/user`);
    }

}

class UIComponent {

    constructor(private userService: UserService) {
    }

    findUser(): void {
        forkJoin([
            this.userService.findUser(), 
            this.userService.findUser(),
            this.userService.findUser()
        ]).subscribe(); // This will run only one server request
    }

}
```

## Saving cache to local storage

If you want to persist your cache to local storage you can use pre-built `BrowserLocalCacheStorage` implementation:

```ts
import { StorageFactory } from './storage.factory';

class UserService {

    @Cacheable({storageFactory: StorageFactory.browserLocalStorage({storagePrefix: 'my-storage-key-prefix'})})
    findUser(): Observable<User> {
        return this.httpClient.get<User>(`/user`);
    }

}
```

## Global cache configuration

You can set some cache parameters globally:

```ts
import { GlobalCacheConfig } from 'ts-cache';

GlobalCacheConfig.set({
    storageFactory: myCustomStorageFactory,
    maxSize: 100
})
```

Here is the full list of available parameters:

```ts
export interface GlobalCacheConfig {
    /** Storage factory function. Provides storage instance */
    storageFactory: SyncStorageFactoryFunction;
    /** Cache key generator implementation */
    keyGenerator: CacheKeyGenerator;
    /** Max cache entries size per cache */
    maxSize?: number;
    /** Max time within which the entry is valid after being added to cache */
    expireAfterWrite?: number;
    /** Max time within which the entry is valid after being last read from cache */
    expireAfterAccess?: number;
}
```

# Cacheable Stream

Cacheable stream is a special type of cache which represents the endless stream of value changes over a time.
Let's take an example:

```ts
import { CacheParamIgnore } from './cache-param-ignore.decorator';

class UserService {

    @CacheableStream()  // #1
    getCurrentUser(): Observable<User> {
        return this.httpClient.get<User>(`/me`);
    }

    @CacheInvalidate() // #2
    refreshUser(): Observable<any> {
        return timer(1000);
    }

    @CacheUpdate() // #3
    updateUser(@CacheParamIgnore() user: User): Observable<User> {
        return this.httpClient.post<User>(`/user`, user);
    }

}
```
`#1` - Opens endless stream which emits user values over a time.
New subscribers will immediately receive the last value emitted by stream.

`#2` - Invalidates the stream. Generally re-subscribes to the original observable and caches the result again.
All existing subscribers will receive the new value as soon as source observable is completed.

`#3` - Directly emits a new value to the stream.
All existing subscribers will receive the new value.

# Logging

There is a simple cache logger which provides error and warnings messages when something goes wrong.
There are 4 logging levels: INFO, WARN, ERROR and NONE. Default level is ERROR.
You can change the default logging level:

```ts
import { CacheLogger, LoggingLevel } from './cache-logger';

CacheLogger.setLoggingLevel(LoggingLevel.WARN);
```

## Performance

Since the library was designed primary for front-end usage, the focus was put on usability rather than on performance,
since s the performance requirements are not so stringent as on the server side.
However, it's still performant enough to handle large amount of data unless you save it to browser local storage
and can be easily tuned to speed up even more if required.
