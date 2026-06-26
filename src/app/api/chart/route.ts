import { withApi } from '@/server/middlewares/api-handler';
import { chartController } from '@/server/controllers/chart.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withApi((req) => chartController.generate(req));
