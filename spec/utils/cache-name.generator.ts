let cacheNum = 0;

export function nextCacheName(): string {
    return `cache-${++cacheNum}`;
}
