import { ArrayUtil } from '../../utils/array.util';
import { CacheLogger } from '../logger/cache-logger';
import { CacheParamConfig } from '../model/cache-parameters';

/**
 * Cache parameters resolver.
 * Builds cache parameters based on provided configuration.
 */
export class CacheParametersResolver {

    /**
     * Builds result array of arguments according to the provided configuration object.
     * @param args - all method arguments
     * @param config - parameters configuration
     */
    public static resolve(args: any[], config?: Array<CacheParamConfig>): any[] {

        if (!config) {
            return args; // Returning all arguments by default
        }

        const includeParams: CacheParamConfig[] = [];
        const ignoreParamsIndexes: Set<number> = new Set<number>();
        config.forEach(param => param.ignore ? ignoreParamsIndexes.add(param.index) : includeParams.push(param));

        // Included params take precedence over ignored.
        // If at least one parameter is marked to be included then we return all included parameters.
        if (ArrayUtil.isNotEmpty(includeParams)) {

            return includeParams.map(param => {

                if (param.index < 0 || param.index > args.length - 1) {
                    CacheLogger.warn(`Cache parameter index is out of range: ${param.index}, actual number of arguments: ${args.length}`, args);
                    return null;
                }

                const value = args[param.index];

                return param.mapper ? param.mapper(value) : value;

            });
        }

        // Returning all non-ignored params
        return args.filter((arg, idx) => !ignoreParamsIndexes.has(idx));

    }

}
