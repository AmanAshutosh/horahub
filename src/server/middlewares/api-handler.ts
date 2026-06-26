import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

type Handler = (req: Request) => Promise<NextResponse>;

/**
 * Wraps an API route with uniform error handling, logging and JSON shaping.
 * Keeps every route body free of try/catch boilerplate.
 */
export function withApi(handler: Handler): Handler {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Invalid request', details: err.flatten() }, { status: 422 });
      }
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
      }
      logger.error({ err }, 'unhandled api error');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  );
}
