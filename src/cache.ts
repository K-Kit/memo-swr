// Cache.ts
interface Cache<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, ttl: number): Promise<void>;
}

class InMemoryCache<T> implements Cache<T> {
  private cache = new Map<string, { expiresAt: number; value: T }>();

  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    return undefined;
  }

  async set(key: string, value: T, ttl: number): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { expiresAt, value });
  }
}

class RedisCache<T> implements Cache<T> {
  constructor(private redisClient: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, mode: string, ttl: number) => Promise<void>;
  }) {}

  async get(key: string): Promise<T | undefined> {
    const data = await this.redisClient.get(key);
    return data ? (JSON.parse(data) as T) : undefined;
  }

  async set(key: string, value: T, ttl: number): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value), 'PX', ttl);
  }
}

export { Cache, InMemoryCache, RedisCache };
