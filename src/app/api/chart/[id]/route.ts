import { NextResponse } from 'next/server';
import { withApi } from '@/server/middlewares/api-handler';
import { chartService } from '@/server/services/chart.service';
import { NotFoundError } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(async (req) => {
  const id = new URL(req.url).pathname.split('/').pop() ?? '';
  const result = await chartService.getById(id);
  if (!result) throw new NotFoundError('Chart');
  return NextResponse.json(result);
});
