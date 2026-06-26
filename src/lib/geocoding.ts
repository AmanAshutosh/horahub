import type { GeocodeResult } from '@/types/api';

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Resolve a place name (village/town/city/district, worldwide) to coordinates
 * and an IANA timezone via the Open-Meteo geocoding API (GeoNames-backed,
 * no API key). Runs server-side so results can be cached and CSP stays tight.
 */
export async function searchPlaces(query: string, count = 8): Promise<GeocodeResult[]> {
  const url = `${ENDPOINT}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
  const res = await fetch(url, { headers: { accept: 'application/json' }, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`geocoding failed: ${res.status}`);
  const data = (await res.json()) as { results?: GeocodeResult[] };
  return data.results ?? [];
}
