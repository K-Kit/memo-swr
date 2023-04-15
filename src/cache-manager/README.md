# memoize.ts - Enhanced Memoize with Stale-While-Revalidate and Custom Cache

This module provides an enhanced memoization function `memoSwrExtra` that leverages the Stale-While-Revalidate caching strategy for asynchronous functions, with added support for custom cache creation and key generation functions.

## Features

- Memoizes the results of asynchronous functions with a Time-To-Live (TTL)
- Automatically updates the cache in the background after the TTL has expired
- Uses Stale-While-Revalidate strategy to serve stale data while updating the cache
- Supports custom cache creation functions and key generation functions
- Integrates with `cache-manager` for flexible caching options

## Usage

### Importing the module

```typescript
import { memoSwrExtra } from './memoize';
```

### Using the memoSwrExtra function

typescriptCopy code

```typescript
// Async function to memoize
async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

// Memoize options
const options = {
  ttl: 60000, // Time-To-Live in milliseconds
};

// Create a memoized version of fetchData
const memoizedFetchData = await memoSwrExtra(fetchData, options);

// Usage of memoized function
(async () => {
  const data = await memoizedFetchData('https://api.example.com/data');
  console.log(data);
})();
```

## API

### memoSwrExtra(fn: AsyncFunction<T, R>, options: MemoizeOptions): Promise<AsyncFunction<T, R>>

- `fn`: The asynchronous function to memoize. It should have a signature of `(...args: T) => Promise<R>`.
- `options`: An object containing the following properties:
  - `ttl`: Time-To-Live (in milliseconds) for the cached results.
  - `createCache` (optional): An asynchronous function that returns a `Promise` resolving to a `Cache` or `MultiCache` instance.
  - `keyGenerator` (optional): A function that generates a unique cache key based on the function's arguments.

Returns a `Promise` that resolves to a memoized version of the provided asynchronous function that utilizes the Stale-While-Revalidate caching strategy.

## Custom Cache Creation

To use a custom cache creation function, simply provide a function that returns a `Promise` resolving to a `Cache` or `MultiCache` instance in the `options` object:

typescriptCopy code

```typescript
async function createCustomCache(): Promise<Cache | MultiCache> {
  // Implement your custom cache creation logic here
  // ...
  return customCache;
}

const options = {
  ttl: 60000,
  createCache: createCustomCache,
};

const memoizedFetchData = await memoSwrExtra(fetchData, options);
```

## Custom Key Generation

To use a custom key generation function, provide a function that generates a unique cache key based on the function's arguments in the `options` object:

typescriptCopy code

```typescript
function customKeyGenerator(args: any[]): string {
  // Implement your custom key generation logic here
  // ...
  return uniqueKey;
}

const options = {
  ttl: 60000,
  keyGenerator: customKeyGenerator,
};

const memoizedFetchData = await memoSwrExtra(fetchData, options);
```
