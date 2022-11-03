import { Mapper } from '../../types/function';
import { CacheParamRegistry } from '../cache-param.registry';
import { PropertyKey } from '../model/property-key';

/**
 * Includes decorated method parameter into a cache key.
 *
 * @param mapper - parameter mapping function if needed.
 */
export function CacheParam<T = any>(mapper?: Mapper<T>): ParameterDecorator {

    return (target: Object,
            propertyKey: PropertyKey,
            paramIndex: number) => {

        CacheParamRegistry.registerParam(target, propertyKey, {index: paramIndex, mapper});

    };

}
