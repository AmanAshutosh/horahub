import { atan2, cos, norm360, sin, tan } from './math';

/**
 * Sidereal ascendant (Lagna) longitude.
 * Approximate near sign boundaries; production swaps in Swiss Ephemeris.
 */
export function ascendant(
  d: number,
  sunMeanLon: number,
  utHours: number,
  longitude: number,
  latitude: number,
  ayanamsa: number,
): number {
  const gmst0 = norm360(sunMeanLon + 180) / 15;
  const lst = norm360((gmst0 + utHours) * 15 + longitude);
  const obliquity = 23.4393 - 3.563e-7 * d;
  const a = atan2(cos(lst), -(sin(lst) * cos(obliquity) + tan(latitude) * sin(obliquity)));
  return norm360(a - ayanamsa);
}
