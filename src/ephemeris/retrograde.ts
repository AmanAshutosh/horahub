import type { PlanetName } from '@/types/chart';

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Derive retrograde flags from two sidereal-longitude snapshots one day
 * apart. A body is retrograde when its ecliptic longitude moved backward
 * over that interval — the shortest-angle signed difference is negative.
 * Generic across both ephemeris backends since both expose
 * `siderealPositions(utcMs)` with no other astronomy required.
 */
export function computeRetrograde(
  current: Record<PlanetName, number>,
  previousDay: Record<PlanetName, number>,
): Partial<Record<PlanetName, boolean>> {
  const result: Partial<Record<PlanetName, boolean>> = {};
  for (const name of Object.keys(current) as PlanetName[]) {
    const prev = previousDay[name];
    if (prev === undefined) continue;
    const diff = (((current[name]! - prev) % 360) + 540) % 360 - 180; // signed, (-180, 180]
    result[name] = diff < 0;
  }
  return result;
}
