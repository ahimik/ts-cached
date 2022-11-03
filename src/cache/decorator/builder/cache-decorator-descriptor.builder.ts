import { Supplier } from '../../../types/function';
import { CacheParamRegistry } from '../../cache-param.registry';
import { GlobalCacheConfig } from '../../config/global-cache.config';
import { CacheKeyGenerator } from '../../generator/cache-key.generator';
import { CacheFilter } from '../../model/cache-filter';
import { CacheKey } from '../../model/cache-key';
import { CacheableType } from '../../model/cacheable-type';
import { PropertyKey } from '../../model/property-key';
import { CacheParametersResolver } from '../../resolver/cache-parameters.resolver';

/**
 * Helps to build a descriptor for cache decorators by wrapping some common logic.
 */
export class CacheDecoratorDescriptorBuilder<E> {

    private filter?: CacheFilter;
    private keyGenerator?: CacheKeyGenerator;

    constructor(private target: Object,
                private propertyKey: PropertyKey,
                private descriptor: TypedPropertyDescriptor<CacheableType<E>>) {
    }

    withFilter(filter?: CacheFilter): CacheDecoratorDescriptorBuilder<E> {
        this.filter = filter;
        return this;
    }

    withKeyGenerator(keyGenerator?: CacheKeyGenerator): CacheDecoratorDescriptorBuilder<E> {
        this.keyGenerator = keyGenerator;
        return this;
    }

    build(descriptorCallback: (sourceSupplier: Supplier<E>, cacheKey: CacheKey) => E): TypedPropertyDescriptor<CacheableType<E>> {

        const {target, propertyKey, filter, keyGenerator} = this;
        const originalFunction = this.descriptor.value!;
        const descriptor = this.descriptor;

        descriptor.value = function(this: unknown, ...args: any[]) {

            const sourceSupplier = () => originalFunction.call(this, ...args);

            // Executing filter if specified
            if (filter && !filter(...args)) {
                return sourceSupplier(); // Bypass caching if filter doesn't match
            }

            const globalConfig = GlobalCacheConfig.get();

            // Building cache key from function arguments
            const cacheParameters = CacheParametersResolver.resolve(args, CacheParamRegistry.getRegisteredParams(target, propertyKey));
            const cacheKey = (keyGenerator || globalConfig.keyGenerator)(...cacheParameters);

            // Executing provided callback
            return descriptorCallback(sourceSupplier, cacheKey);

        };

        return descriptor;
    }

}
