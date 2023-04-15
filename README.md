# memoize.ts - Memoization with Stale-While-Revalidate and Enhanced Customization

This module provides two memoization functions, `memoSwr` and `memoSwrExtra`, that leverage the Stale-While-Revalidate caching strategy for asynchronous functions. The `memoSwr` function provides basic memoization capabilities, while `memoSwrExtra` enhances the memoization with support for custom cache creation and key generation functions.

- [Simple Cache](./src/simple/readme.md)
- [Cache Manager](./src/cache-manager/readme.md)

## Features

- Memoizes the results of asynchronous functions with a Time-To-Live (TTL)
- Automatically updates the cache in the background after the TTL has expired
- Uses Stale-While-Revalidate strategy to serve stale data while updating the cache
- Custom cache implementation support (`memoSwr`)
- Supports custom cache creation functions and key generation functions (`memoSwrExtra`)
- Integrates with `cache-manager` for flexible caching options (`memoSwrExtra`)

## Usage

Both functions have similar usage patterns, with `memoSwrExtra` offering additional options for customization.

### Importing the module

```typescript
import { memoSwr, memoSwrExtra } from './memo-swr';
```

### Using the memoSwr or memoSwrExtra function

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

// Create a memoized version of fetchData using memoSwr
const memoizedFetchData = memoSwr(fetchData, options);

// or using memoSwrExtra with additional customization
const memoizedFetchDataExtra = await memoSwrExtra(fetchData, {
  ...options,
  createCache: createCustomCache,
  keyGenerator: customKeyGenerator,
});

// Usage of memoized function
(async () => {
  const data = await memoizedFetchData('https://api.example.com/data');
  console.log(data);
})();
```

Refer to the previous responses for detailed documentation on how to use `memoSwr` and `memoSwrExtra`, as well as implementing custom cache creation and key generation functions.
