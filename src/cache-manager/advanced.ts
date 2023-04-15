// memoize.ts
import { Cache, MultiCache, caching } from 'cache-manager';

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface MemoizeOptions {
  ttl: number;
  createCache?: () => Promise<Cache | MultiCache>;
  keyGenerator?: (args: any[]) => string;
}
/**
 * Memoizes an async function with stale-while-revalidate (SWR) caching strategy using cache-manager.
 * The function will return cached data if available and then refresh the cache
 * in the background when it gets stale.
 *
 * @template T - The function's argument types.
 * @template R - The function's return type.
 * @param {AsyncFunction<T, R>} fn - The async function to memoize.
 * @param {MemoizeOptions} options - The options for memoization.
 * @param {number} options.ttl - The time-to-live (TTL) for cache entries in milliseconds.
 * @param {() => Promise<Cache | MultiCache>} [options.createCache] - A function that returns a cache or multi-cache instance.
 * @param {(args: any[]) => string} [options.keyGenerator] - A function to generate cache keys based on the function arguments.
 * @returns {Promise<AsyncFunction<T, R>>} - A promise that resolves to the memoized async function.
 *
 * @example
 * import { memoSwrExtra } from './memoSwrExtra';
 * import { Cache } from 'cache-manager';
 *
 * async function fetchData(id) {
 *   const response = await fetch(`https://api.example.com/data/${id}`);
 *   return response.json();
 * }
 *
 * const createCache = async () => {
 *   return new Cache({ store: 'memory', max: 100, ttl: 60000 });
 * };
 *
 * const keyGenerator = (args) => `data_${args[0]}`;
 *
 * (async () => {
 *   const memoizedFetchData = await memoSwrExtra(fetchData, { ttl: 60000, createCache, keyGenerator });
 *
 *   async function main() {
 *     const data = await memoizedFetchData(1);
 *     console.log(data);
 *   }
 *
 *   main();
 * })();
 */
export async function swrCacheManager<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  options: MemoizeOptions
): Promise<AsyncFunction<T, R>> {
  const { ttl = 10, createCache, keyGenerator } = options;
  const cache =
    (createCache && (await createCache())) ||
    (await caching('memory', {
      ttl: ttl * 1000,
      max: 100,
      allowStale: true,
    }));
  const timers = new Map<string, NodeJS.Timeout>();

  function refetch(key: string, ...args: T): void {
    clearTimeout(timers.get(key) as NodeJS.Timeout);
    timers.delete(key);

    // Fetch new data in the background
    Promise.resolve(fn(...args))
      .then(async result => {
        await cache.set(key, result, ttl / 1000);
        setTTL(key, ...args);
      })
      .catch(error => {
        console.error('Error refetching data:', error);
        setTTL(key, ...args);
      });
  }

  function setTTL(key: string, ...args: T): void {
    const timer = setTimeout(() => {
      refetch(key, ...args);
    }, ttl);
    timers.set(key, timer);
  }

  return async function(...args: T): Promise<R> {
    const key = keyGenerator ? keyGenerator(args) : JSON.stringify(args);
    let result = (await cache.get(key)) as R;

    if (result === undefined) {
      result = await fn(...args);
      await cache.set(key, result, ttl / 1000);
      setTTL(key, ...args);
    } else if (!timers.has(key)) {
      refetch(key, ...args);
    }
    return result;
  };
}
