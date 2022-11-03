import { Mapper } from '../../types/function';

/**
 * @internal
 * Parameter configuration.
 */
export interface CacheParamConfig<E = any> {
    index: number; // Parameter index
    mapper?: Mapper<E>; // Parameter mapping function
    ignore?: boolean; // Whether to ignore param
}

