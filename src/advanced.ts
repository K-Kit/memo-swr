// memoize.ts
import { Cache, MultiCache, caching } from 'cache-manager';

type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

interface MemoizeOptions {
  ttl: number;
  createCache?: () => Promise<Cache | MultiCache>;
  keyGenerator?: (args: any[]) => string;
}

export async function memoSwrExtra<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  options: MemoizeOptions
): Promise<AsyncFunction<T, R>> {
  const { ttl, createCache, keyGenerator } = options;
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
