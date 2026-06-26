import { createHash } from 'node:crypto';

/** Stable hash of normalized birth inputs → chart cache key. */
export function birthHash(input: {
  birthDate: string; birthTime: string; latitude: number; longitude: number; tzName: string;
}): string {
  const canonical = [
    input.birthDate, input.birthTime,
    input.latitude.toFixed(4), input.longitude.toFixed(4), input.tzName,
  ].join('|');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}
