import { Cache, InMemoryCache } from './cache';

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface MemoizeOptions {
  ttl: number;
  cache?: Cache<any>;
}
/**
 * Memoizes an async function with stale-while-revalidate (SWR) caching strategy.
 * The function will return cached data if available and then refresh the cache
 * in the background when it gets stale.
 *
 * @template T - The function's argument types.
 * @template R - The function's return type.
 * @param {AsyncFunction<T, R>} fn - The async function to memoize.
 * @param {MemoizeOptions} options - The options for memoization.
 * @param {number} options.ttl - The time-to-live (TTL) for cache entries in milliseconds.
 * @param {Cache<any>} [options.cache] - The cache implementation to use for memoization.
 * @returns {AsyncFunction<T, R>} - The memoized async function.
 *
 * @example
 * import { memoSwr } from './memoSwr';
 *
 * async function fetchData(id) {
 *   const response = await fetch(`https://api.example.com/data/${id}`);
 *   return response.json();
 * }
 *
 * const memoizedFetchData = memoSwr(fetchData, { ttl: 60000 });
 *
 * async function main() {
 *   const data = await memoizedFetchData(1);
*   console.log(data);
 * }
 *
 * main();
 */
function memoSwr<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  options: MemoizeOptions
): AsyncFunction<T, R> {
  const { ttl=5000, cache = new InMemoryCache<R>() } = options;
  const timers = new Map<string, NodeJS.Timeout>();

  function refetch(key: string, ...args: T): void {
    clearTimeout(timers.get(key) as NodeJS.Timeout);
    timers.delete(key);

    // Fetch new data in the background
    Promise.resolve(fn(...args))
      .then(async result => {
        await cache.set(key, result, ttl);
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
    const key = JSON.stringify(args);
    let result = await cache.get(key);

    if (result === undefined) {
      result = await fn(...args);
      await cache.set(key, result, ttl);
      setTTL(key, ...args);
    } else if (!timers.has(key)) {
      refetch(key, ...args);
    }

    return result;
  };
}

export { memoSwr };
