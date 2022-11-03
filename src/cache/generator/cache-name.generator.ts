import { PropertyKey } from '../model/property-key';

/**
 * Generates cache name.
 */
export interface CacheNameGenerator {

    generate(target: any, propertyKey: PropertyKey): string;

}

/**
 * Generates cache name which consists of a class name and a function name.
 */
export class DefaultCacheNameGenerator implements CacheNameGenerator {

    generate(target: any, propertyKey: string | symbol): string {
        return `${target.constructor.name}.${String(propertyKey)}`;
    }

}

export const DEFAULT_CACHE_NAME_GENERATOR = new DefaultCacheNameGenerator();
