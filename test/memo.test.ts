// @ts-nocheck
const { memoizeWithStaleWhileRevalidate } = require('../dist');
// Mock function to test memoization
const mockFn = jest.fn(x => x * 2);

const ttl = 3;
const memoizedMockFn = memoizeWithStaleWhileRevalidate(mockFn, ttl);

const delay = async s => new Promise(resolve => setTimeout(resolve, s));

beforeEach(() => {
  mockFn.mockClear();
});

describe('memoizeWithStaleWhileRevalidate', () => {
  test('should call the original function when not memoized', async () => {
    const result = await memoizedMockFn(1);
    await memoizedMockFn(1);
    await memoizedMockFn(1);
    await memoizedMockFn(1);

    expect(result).toBe(2);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should return memoized result within TTL', async () => {
    await memoizedMockFn(1);
    await memoizedMockFn(1);
    await memoizedMockFn(1);
    await delay(3);
    const result = await memoizedMockFn(1);
    expect(result).toBe(2);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should refetch after TTL and serve stale content', async done => {
    await memoizedMockFn(1);
    await delay(3);
    const result = await memoizedMockFn(1);
    expect(result).toBe(2);
    expect(mockFn).toHaveBeenCalledTimes(1);
    done();
  });

  test('should handle separate cache entries for different arguments', async () => {
    await memoizedMockFn(1);
    await memoizedMockFn(2);
    await memoizedMockFn(1);
    await memoizedMockFn(2);
    await delay(5);
    await memoizedMockFn(1);
    await memoizedMockFn(2);
    await memoizedMockFn(1);
    await memoizedMockFn(2);
    await memoizedMockFn(1);
    await memoizedMockFn(2);
    await memoizedMockFn(1);
    await memoizedMockFn(2);
    expect(mockFn).toHaveBeenCalledTimes(4);
  });
});
