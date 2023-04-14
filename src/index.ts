type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

function memoizeWithStaleWhileRevalidate<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  ttl: number
): AsyncFunction<T, R> {
  const cache = new Map<string, R>();
  const timers = new Map<string, number>();

  function refetch(key: string, ...args: T): void {
    clearTimeout(timers.get(key) as number);
    timers.delete(key);

    // Fetch new data in the background
    Promise.resolve(fn(...args))
      .then((result) => {
        cache.set(key, result);
        setTTL(key, ...args);
      })
      .catch((error) => {
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

    if (!cache.has(key)) {
      const result = await fn(...args);
      cache.set(key, result);
      setTTL(key, ...args);
    } else if (!timers.has(key)) {
      refetch(key, ...args);
    }

    return cache.get(key) as R;
  };
}
