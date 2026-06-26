import type { BirthInput, ChartFacts, PlanetName } from '@/types/chart';
import { assembleChartFacts, utcParts } from './assemble';
import { ascendant } from './ascendant';
import { lahiriAyanamsa } from './ayanamsa';
import { moonPosition, planetPosition, rahuPosition, sunPosition } from './bodies';
import { dayNumber, norm360 } from './math';

/**
 * The seam between calculation and interpretation. Any implementation that
 * returns ChartFacts (analytic, or the Swiss Ephemeris binding) is a valid
 * drop-in; nothing downstream depends on how the numbers were produced.
 */
export interface Ephemeris {
  readonly id: string;
  compute(input: BirthInput): ChartFacts;
}

/** Pure-JS analytic positions (Schlyter). ~arc-minute accuracy; runs anywhere. */
export class AnalyticEphemeris implements Ephemeris {
  readonly id = 'analytic';

  compute(input: BirthInput): ChartFacts {
    const { Y, Mo, D, utHours } = utcParts(input.utcMs);
    const d = dayNumber(Y, Mo, D, utHours);
    const sun = sunPosition(d);
    const ayanamsa = lahiriAyanamsa(d);

    const tropical: Record<PlanetName, number> = {
      Sun: sun.lon,
      Moon: moonPosition(d, sun.meanLon),
      Mars: planetPosition('Mars', d, sun),
      Mercury: planetPosition('Mercury', d, sun),
      Jupiter: planetPosition('Jupiter', d, sun),
      Venus: planetPosition('Venus', d, sun),
      Saturn: planetPosition('Saturn', d, sun),
      Rahu: rahuPosition(d),
      Ketu: norm360(rahuPosition(d) + 180),
    };

    const sidereal = {} as Record<PlanetName, number>;
    (Object.keys(tropical) as PlanetName[]).forEach((p) => {
      sidereal[p] = norm360(tropical[p] - ayanamsa);
    });

    const ascLon = ascendant(d, sun.meanLon, utHours, input.longitude, input.latitude, ayanamsa);
    return assembleChartFacts(sidereal, ascLon, ayanamsa, input.utcMs);
  }
}

export const analyticEphemeris: Ephemeris = new AnalyticEphemeris();
