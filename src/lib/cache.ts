import { Redis } from '@upstash/redis';

/**
 * Optional Redis cache. If Upstash env vars are absent the app runs with a
 * no-op cache, so local development needs no Redis.
 */
interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
}

class NoopCache implements Cache {
  async get<T>(): Promise<T | null> { return null; }
  async set(): Promise<void> { /* no-op */ }
}

class RedisCache implements Cache {
  constructor(private readonly redis: Redis) {}
  async get<T>(key: string): Promise<T | null> {
    return (await this.redis.get<T>(key)) ?? null;
  }
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.redis.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined);
  }
}

function build(): Cache {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return new NoopCache();
  return new RedisCache(new Redis({ url, token }));
}

export const cache: Cache = build();
