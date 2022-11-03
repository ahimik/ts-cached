import { isObservable } from 'rxjs';
import { ReturnType } from '../model/return-type';

/** Resolves value type */
export interface ValueTypeResolver {

    resolve(value: any): ReturnType;

}

/** Default value type resolver */
export class DefaultValueTypeResolver implements ValueTypeResolver {

    resolve(value: any): ReturnType {
        if (isObservable(value)) {
            return ReturnType.Observable;
        } else if (value instanceof Promise) {
            return ReturnType.Promise;
        } else {
            return ReturnType.Value;
        }
    }
}

export const DEFAULT_VALUE_TYPE_RESOLVER: ValueTypeResolver = new DefaultValueTypeResolver();
