import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Sliding-window rate limiter on chart generation. No-op when Upstash is
 * unconfigured (always allows), so it never blocks local development.
 */
interface Limiter {
  check(identifier: string): Promise<{ success: boolean; remaining: number }>;
}

class AllowAll implements Limiter {
  async check(): Promise<{ success: boolean; remaining: number }> {
    return { success: true, remaining: Number.MAX_SAFE_INTEGER };
  }
}

class UpstashLimiter implements Limiter {
  private readonly limiter: Ratelimit;
  constructor(redis: Redis) {
    this.limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '60 s'),
      prefix: 'horahub:rl',
    });
  }
  async check(identifier: string): Promise<{ success: boolean; remaining: number }> {
    const { success, remaining } = await this.limiter.limit(identifier);
    return { success, remaining };
  }
}

function build(): Limiter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return new AllowAll();
  return new UpstashLimiter(new Redis({ url, token }));
}

export const rateLimiter: Limiter = build();
