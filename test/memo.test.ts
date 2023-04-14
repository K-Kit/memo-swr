import { memoizeWithStaleWhileRevalidate } from '../src';
// Mock function to test memoization
const mockFn = jest.fn(async x => x * 2);

// Memoized function with a 50ms TTL
//
const memoizedMockFn = memoizeWithStaleWhileRevalidate(mockFn, 50);

beforeEach(() => {
  mockFn.mockClear();
});

test('should call the original function when not memoized', async () => {
  const result = await memoizedMockFn(1);
  expect(result).toBe(2);
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test('should return memoized result within TTL', async () => {
  await memoizedMockFn(1);
  await new Promise(resolve => setTimeout(resolve, 30));
  const result = await memoizedMockFn(1);
  expect(result).toBe(2);
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test('should refetch after TTL and serve stale content', async done => {
  await memoizedMockFn(1);
  await new Promise(resolve => setTimeout(resolve, 60));
  const result = await memoizedMockFn(1);
  expect(result).toBe(2);
  expect(mockFn).toHaveBeenCalledTimes(1);

  setTimeout(() => {
    expect(mockFn).toHaveBeenCalledTimes(2);
    done();
  }, 10);
});

test('should handle separate cache entries for different arguments', async () => {
  await memoizedMockFn(1);
  await memoizedMockFn(2);
  expect(mockFn).toHaveBeenCalledTimes(2);
});
