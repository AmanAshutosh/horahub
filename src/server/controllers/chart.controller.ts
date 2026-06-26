import { NextResponse } from 'next/server';
import { generateChartSchema } from '@/server/validators/chart.validator';
import { chartService } from '@/server/services/chart.service';
import { rateLimiter } from '@/lib/ratelimit';
import { RateLimitError } from '@/lib/errors';
import { clientIp } from '@/server/middlewares/api-handler';

/** HTTP concerns only: parse, validate, rate-limit, delegate, respond. */
export const chartController = {
  async generate(req: Request): Promise<NextResponse> {
    const { success } = await rateLimiter.check(clientIp(req));
    if (!success) throw new RateLimitError();

    const body = await req.json();
    const dto = generateChartSchema.parse(body);
    const result = await chartService.generate(dto);
    return NextResponse.json(result, { status: 201 });
  },
};
