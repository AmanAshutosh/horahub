import { withApi } from '@/server/middlewares/api-handler';
import { geocodeController } from '@/server/controllers/geocode.controller';

export const runtime = 'nodejs';

export const GET = withApi((req) => geocodeController.search(req));
