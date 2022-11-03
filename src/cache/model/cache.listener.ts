import { isObservable, Subject } from 'rxjs';

export interface InvalidationInfo {
    key?: string; // Invalidation cache key
    all?: boolean; // Whether all entries have been invalidated
}

export type CacheInvalidateListenerFn = (info: InvalidationInfo) => void;

export type CacheInvalidateListenerSubject = Subject<InvalidationInfo>;

export interface UpdateInfo<E> {
    key: string;
    value: E;
}

export type CacheUpdateListenerFn<E = any> = (info: UpdateInfo<E>) => void;

export type CacheUpdateListenerSubject<E = any> = Subject<UpdateInfo<E>>;


export interface CacheListener<T = any> {

    listen(info: T): void;

}

export class CacheInvalidateListener implements CacheListener<InvalidationInfo> {

    private readonly listener: CacheInvalidateListenerFn;

    constructor(listener: CacheInvalidateListenerFn | CacheInvalidateListenerSubject) {
        this.listener = isObservable(listener) ? (info) => listener.next(info) : listener;
    }

    listen(info: InvalidationInfo): void {
        this.listener(info);
    }

}

export class CacheUpdateListener<E = any> implements CacheListener<UpdateInfo<E>> {

    private readonly listener: CacheUpdateListenerFn<E>;

    constructor(listener: CacheUpdateListenerFn<E> | CacheUpdateListenerSubject<E>) {
        this.listener = isObservable(listener) ? (info) => listener.next(info) : listener;
    }

    listen(info: UpdateInfo<E>): void {
        this.listener(info);
    }

}
