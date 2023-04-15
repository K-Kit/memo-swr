// memoize.ts
import { Cache, InMemoryCache } from './cache';

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface MemoizeOptions {
  ttl: number;
  cache?: Cache<any>;
}

function memoizeWithStaleWhileRevalidate<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  options: MemoizeOptions
): AsyncFunction<T, R> {
  const { ttl, cache = new InMemoryCache<R>() } = options;
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

export { memoizeWithStaleWhileRevalidate };
export default memoizeWithStaleWhileRevalidate;
