import { Observable } from 'rxjs';

/**
 * Returns new Observable from callable function.
 * @param callable - source function
 */
export function fromCallable<C>(callable: () => C): Observable<C> {
    return new Observable<C>(observer => {
        observer.next(callable());
        observer.complete();
    });
}
