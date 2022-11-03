import { CacheParamRegistry } from '../cache-param.registry';
import { PropertyKey } from '../model/property-key';

/**
 * Excludes decorated method parameter from a cache key.
 */
export function CacheParamIgnore(): ParameterDecorator {

    return (target: Object,
            propertyKey: PropertyKey,
            paramIndex: number) => {

        CacheParamRegistry.registerParam(target, propertyKey, {index: paramIndex, ignore: true});

    };

}
