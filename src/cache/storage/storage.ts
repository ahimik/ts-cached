import { Observable } from 'rxjs';

/**
 * Sync Storage abstraction.
 */
export interface SyncStorage<E> {

    /** Puts item in storage */
    put(key: string, value: E): void;

    /** Retrieves item from storage */
    get(key: string): E | null;

    /** Removes item from storage */
    remove(key: string): void;

    /** Clears storage completely */
    clear(): void;

    /** Returns size of storage */
    getSize(): number;

    /** Returns all entries as map */
    getAsMap(): Map<string, E>;

}

/**
 * Asynchronous Storage abstraction.
 */
export interface AsyncStorage<E> {

    /** Puts item in asynchronous storage */
    putAsync(key: string, value: E): Observable<E>;

    /** Retrieves item from asynchronous storage */
    getAsync(key: string): Observable<E | null>;

    /** Removes item from asynchronous storage */
    removeAsync(key: string): Observable<void>;

    /** Removes all items from asynchronous storage */
    clearAsync(): Observable<void>;

}
