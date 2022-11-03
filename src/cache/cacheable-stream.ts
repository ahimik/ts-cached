import { Observable, of, Subject } from 'rxjs';
import { filter, finalize, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { doOnSubscribe } from '../observable/do-on-subscribe';
import { Supplier } from '../types/function';

/** Refresh stream request */
export class RefreshRequest {
}

/**
 * Update stream request.
 */
export class UpdateRequest<E> {
    constructor(public readonly value: E) {
    }
}

/** Stream request type */
type StreamRequest<E> = RefreshRequest | UpdateRequest<E>;

/** Cached stream configuration */
export interface CachedStreamConfig<E> {
    loadingListener?: Subject<boolean>; // Loading listener. Stream publishes loading events when source observable is running
    initialValue?: E; // Initial stream value
    valueLoaded?: (value: E) => any; // Callback function which gets executed when new value is loaded
}

export class CacheableStream<E> {

    /** Stream request emitter */
    private readonly subject = new Subject<StreamRequest<E>>();
    /** The stream itself */
    private readonly stream$: Observable<E>;

    constructor(private sourceSupplier: Supplier<Observable<E>>,
                private config?: CachedStreamConfig<E>) {

        this.stream$ = this.initStream(this.subject.asObservable(), config);

    }

    /**
     * Returns cached stream.
     */
    getStream(): Observable<E> {
        return this.stream$;
    }

    /**
     * Disposes the stream.
     */
    dispose(): void {
        this.subject.complete();
    }

    /**
     * Requests refresh or update operation against stream.
     * @param request - request
     */
    request(request: StreamRequest<E>): void {
        this.subject.next(request);
    }

    /**
     * Modify stream source observable.
     * The source is used by the stream to load the initial value or after invalidate operation.
     * @param sourceSupplier - source observable supplier
     */
    setSource(sourceSupplier: Supplier<Observable<E>>): void {
        this.sourceSupplier = sourceSupplier;
    }

    private initStream(requestStream$: Observable<StreamRequest<E>>,
                       config?: CachedStreamConfig<E>): Observable<E> {

        // Defining initial value
        const initialRequest = config?.initialValue != null
            ? new UpdateRequest(config.initialValue)
            : new RefreshRequest();

        let loading = false;

        return requestStream$.pipe(
            startWith(initialRequest),
            switchMap(request =>
                this.processRequest(request).pipe(
                    doOnSubscribe(() => {
                        loading = true;
                        config?.loadingListener && config.loadingListener.next(loading);
                    }),
                    finalize(() => {
                        loading = false;
                        config?.loadingListener && config.loadingListener.next(loading);
                    })
                )
            ),
            // Since finalize finishes after the value being filtered we set loading = false explicitly before replaying the value
            tap(value => {
                this.onValueLoaded(value, config);
                loading = false;
            }),
            shareReplay(1), // Share and replay last emitted value regardless of subscribers count.
            filter(() => !loading) // Replay last value when no other request is in progress only
        );
    }

    private onValueLoaded(value: E, config?: CachedStreamConfig<E>): void {
        // Execute onValueLoaded callback if provided
        if (config?.valueLoaded) {
            config.valueLoaded(value);
        }
    }

    private processRequest(request: StreamRequest<E>): Observable<E> {
        if (request instanceof UpdateRequest) {
            return of(request.value);
        } else {
            return this.sourceSupplier();
        }
    }

}
