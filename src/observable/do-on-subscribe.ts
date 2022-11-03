import { defer, Observable } from 'rxjs';

/**
 * Executes callback function on subscription.
 */
export function doOnSubscribe<T>(callback: () => void): (source: Observable<T>) => Observable<T> {
    return (source: Observable<T>) => defer(() => {
        callback();
        return source;
    });
}
