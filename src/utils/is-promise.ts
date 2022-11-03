export function isPromise(value: any): value is PromiseLike<any> {
    return typeof value?.then === 'function';
}
