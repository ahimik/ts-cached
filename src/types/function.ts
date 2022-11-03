/** Mapping function. Maps given value T to different value type R */
export type Mapper<T, R = any> = (object: T, idx?: number) => R;
/** Supplying function. Provides value T */
export type Supplier<T> = () => T;
