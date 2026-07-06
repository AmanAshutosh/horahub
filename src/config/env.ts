import { z } from 'zod';

/** Validated, typed environment. Fails fast at boot if misconfigured. */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),
  AUTH_SECRET: z.string().min(1).default('dev-secret-change-me'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  KB_VERSION: z.string().default('kb-v1'),
  EPHEMERIS_PROVIDER: z.enum(['analytic', 'swiss']).default('analytic'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success && process.env.NODE_ENV !== 'test') {
  // Surface a readable error instead of a deep stack on a missing var.
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
}

// On failure, fall back to each variable's own raw value (not a blanket reset).
// A single unrelated bad field (e.g. an empty-string EPHEMERIS_PROVIDER left over
// in a dashboard) must never discard an otherwise-valid DATABASE_URL — that
// previously surfaced as a false "Database is not configured" error even when
// the database was configured correctly.
export const env = parsed.success
  ? parsed.data
  : ({
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      DIRECT_URL: process.env.DIRECT_URL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
      AUTH_SECRET: process.env.AUTH_SECRET || 'dev-secret-change-me',
      NODE_ENV: (['development', 'test', 'production'] as const).includes(process.env.NODE_ENV as never)
        ? (process.env.NODE_ENV as 'development' | 'test' | 'production')
        : 'development',
      KB_VERSION: process.env.KB_VERSION || 'kb-v1',
      EPHEMERIS_PROVIDER: process.env.EPHEMERIS_PROVIDER === 'swiss' ? 'swiss' : 'analytic',
    } satisfies z.infer<typeof schema>);
