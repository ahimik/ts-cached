/**
 * Cacheable type.
 * Is used to apply type-checking to decorator functions.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type CacheableValueType<T> = any; // Currently any type is cacheable otherwise use Exclude<Observable<any>, T> for example.

/**
 * TypedPropertyDescriptor value type.
 * Is used to apply type-checking to decorator functions.
 */
export type CacheableType<T> = (...args: Array<any>) => T;
