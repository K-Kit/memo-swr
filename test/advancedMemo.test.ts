import { caching, Cache } from 'cache-manager';
import { swrCacheManager } from '../src';

// const mockFn = vitest.fn(async (x) => x * 2);

const ttl = 3000;
// const memoizedMockFn = swrCacheManager(mockFn, { ttl });

const delay = async (s: number | undefined = ttl + 2000) =>
  new Promise(resolve => setTimeout(resolve, s));

const fetchData = async (id: number): Promise<string> => {
  return `data:${id}`;
};

const mockFn = jest.fn(fetchData);

const createAsyncCache = async (): Promise<Cache> => {
  return caching('memory', { max: 100, ttl: 1000 });
};

test('should memoize function and serve stale content while refetching', async () => {
  const memoizedFetchData = await swrCacheManager(mockFn, {
    ttl: 1000, // 1 second
    createCache: createAsyncCache,
  });

  const firstCall = await memoizedFetchData(1);
  expect(firstCall).toBe('data:1');
  expect(mockFn).toHaveBeenCalledTimes(1);

  const secondCall = await memoizedFetchData(1);
  expect(secondCall).toBe('data:1');
  expect(mockFn).toHaveBeenCalledTimes(1);

  // Wait for TTL to expire and refetch
  await new Promise(resolve => setTimeout(resolve, 1100));

  // The third call should still return the stale value
  const thirdCall = await memoizedFetchData(1);
  expect(thirdCall).toBe('data:1');

  // Wait for refetch to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  const fourthCall = await memoizedFetchData(1);
  expect(fourthCall).toBe('data:1');
});

test('should refetch data for different arguments', async () => {
  const memoizedFetchData = await swrCacheManager(fetchData, {
    ttl: 1000, // 1 second
    createCache: createAsyncCache,
  });

  const firstCall = await memoizedFetchData(1);
  expect(firstCall).toBe('data:1');

  const secondCall = await memoizedFetchData(2);
  expect(secondCall).toBe('data:2');
});
