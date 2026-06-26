import type { ChartFacts, HousePlacement, PlanetName, PlanetPlacement } from '@/types/chart';
import { SIGN_LORD } from '@/constants/astro';
import { buildVimshottari } from './dasha';
import { dignityOf } from './dignity';
import { norm360 } from './math';
import { nakshatraOf, navamsaSign } from './nakshatra';

export const PLANET_ORDER: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

/**
 * Provider-agnostic assembly of ChartFacts from sidereal longitudes + ascendant.
 * Both the analytic and Swiss Ephemeris implementations feed this single
 * function, so houses, nakṣatra, navāṁśa, dignity and daśā are computed
 * identically regardless of how the longitudes were produced.
 */
export function assembleChartFacts(
  sidereal: Record<PlanetName, number>,
  ascendantLon: number,
  ayanamsa: number,
  birthUtcMs: number,
): ChartFacts {
  const lagnaSign = Math.floor(norm360(ascendantLon) / 30);

  const planets = {} as Record<PlanetName, PlanetPlacement>;
  for (const name of PLANET_ORDER) {
    const lon = norm360(sidereal[name]);
    const sign = Math.floor(lon / 30);
    const nak = nakshatraOf(lon);
    planets[name] = {
      siderealLon: lon,
      sign,
      degInSign: lon % 30,
      house: ((sign - lagnaSign + 12) % 12) + 1,
      nakshatra: nak.index,
      pada: nak.pada,
      navamsaSign: navamsaSign(lon),
      dignity: dignityOf(name, sign),
    };
  }

  const houses: HousePlacement[] = [];
  for (let h = 1; h <= 12; h += 1) {
    const sign = (lagnaSign + h - 1) % 12;
    houses.push({
      house: h,
      sign,
      lord: SIGN_LORD[sign]!,
      occupants: PLANET_ORDER.filter((p) => planets[p].house === h),
    });
  }

  const moon = planets.Moon;
  const dasha = buildVimshottari(moon.siderealLon, birthUtcMs);

  return {
    ayanamsa,
    ascendant: { sign: lagnaSign, degree: norm360(ascendantLon) % 30 },
    lagnaSign,
    moon: { sign: moon.sign, nakshatra: moon.nakshatra, pada: moon.pada },
    planets,
    houses,
    dasha,
  };
}

/** Split a UTC instant into the calendar parts the ephemerides consume. */
export function utcParts(utcMs: number): { Y: number; Mo: number; D: number; utHours: number } {
  const date = new Date(utcMs);
  return {
    Y: date.getUTCFullYear(),
    Mo: date.getUTCMonth() + 1,
    D: date.getUTCDate(),
    utHours: date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600,
  };
}
