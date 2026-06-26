import type { GeocodeResult } from '@/types/api';
import { searchPlaces } from '@/lib/geocoding';
import { cache } from '@/lib/cache';

export const geocodeService = {
  async search(query: string): Promise<GeocodeResult[]> {
    const key = `geo:${query.toLowerCase()}`;
    const cached = await cache.get<GeocodeResult[]>(key);
    if (cached) return cached;
    const results = await searchPlaces(query);
    await cache.set(key, results, 60 * 60 * 24);
    return results;
  },
};
