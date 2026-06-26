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

export const env = parsed.success
  ? parsed.data
  : ({ NODE_ENV: 'development', KB_VERSION: 'kb-v1', EPHEMERIS_PROVIDER: 'analytic', AUTH_SECRET: 'dev-secret-change-me', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', DATABASE_URL: '' } as z.infer<typeof schema>);
