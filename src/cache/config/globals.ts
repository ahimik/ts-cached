import { DEFAULT_CACHE_NAME_GENERATOR } from '../generator/cache-name.generator';
import { RETURN_TYPE_RESOLVER } from '../resolver/return-type.resolver';
import { DEFAULT_VALUE_TYPE_RESOLVER } from '../resolver/value-type.resolver';
import { SHARE_REPLAY_CACHE_EXECUTOR } from '../share-replay-cache-strategy.executor';

export const Globals = {
    returnTypeResolver: RETURN_TYPE_RESOLVER,
    cacheNameGenerator: DEFAULT_CACHE_NAME_GENERATOR,
    valueTypeResolver: DEFAULT_VALUE_TYPE_RESOLVER,
    cacheExecutor: SHARE_REPLAY_CACHE_EXECUTOR
};
