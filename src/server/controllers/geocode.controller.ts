import { NextResponse } from 'next/server';
import { geocodeSchema } from '@/server/validators/geocode.validator';
import { geocodeService } from '@/server/services/geocode.service';

export const geocodeController = {
  async search(req: Request): Promise<NextResponse> {
    const url = new URL(req.url);
    const { q } = geocodeSchema.parse({ q: url.searchParams.get('q') ?? '' });
    const results = await geocodeService.search(q);
    return NextResponse.json({ results });
  },
};
