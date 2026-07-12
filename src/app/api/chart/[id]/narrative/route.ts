import { withApi } from '@/server/middlewares/api-handler';
import { narrativeController } from '@/server/controllers/narrative.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** .../api/chart/{id}/narrative — id is the second-to-last path segment. */
function chartIdFromUrl(req: Request): string {
  const segments = new URL(req.url).pathname.split('/').filter(Boolean);
  return segments[segments.length - 2] ?? '';
}

/**
 * Kicks off narrative report generation for a chart (v1: synchronous —
 * awaits the full LLM call plan, see narrative.service.ts's doc comment).
 */
export const POST = withApi((req) => narrativeController.generate(chartIdFromUrl(req)));

/** Latest complete narrative report for a chart, or 404 if none exists yet. */
export const GET = withApi((req) => narrativeController.getLatest(chartIdFromUrl(req)));
