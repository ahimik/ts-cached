import { Observable } from 'rxjs';
import { ReturnType } from '../model/return-type';

/** Method return type resolver */
export interface ReturnTypeResolver {

    resolve(target: any, propertyKey: string | symbol): ReturnType | null;

}

/** Resolves decorated method return type based on Reflected Metadata if available */
export class ReflectMetadataReturnTypeResolver implements ReturnTypeResolver {

    resolve(target: any, propertyKey: string | symbol): ReturnType | null {

        if (!Reflect || !('getMetadata' in Reflect)) {
            return null;
        }

        const returnType = (Reflect as any).getMetadata('design:returntype', target, propertyKey);

        if (returnType) {
            if (returnType === Observable) {
                return ReturnType.Observable;
            } else if (returnType === Promise) {
                return ReturnType.Promise;
            }
            return ReturnType.Value;
        }
        return null;
    }

}

/**
 * Delegates resolution to all registered {@link ReturnTypeResolver}.
 */
export class DelegatingReturnTypeResolver implements ReturnTypeResolver {

    constructor(private resolvers: ReturnTypeResolver[]) {
    }

    resolve(target: any, propertyKey: string): ReturnType | null {
        for (const resolver of this.resolvers) {
            const returnType = resolver.resolve(target, propertyKey);
            if (returnType != null) {
                return returnType;
            }
        }
        return null;
    }

}

export const RETURN_TYPE_RESOLVER: ReturnTypeResolver = new DelegatingReturnTypeResolver([
    new ReflectMetadataReturnTypeResolver()
]);

