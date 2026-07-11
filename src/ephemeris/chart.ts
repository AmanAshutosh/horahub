import type { BirthInput, ChartFacts, PlanetName } from '@/types/chart';
import { assembleChartFacts, utcParts } from './assemble';
import { ascendant } from './ascendant';
import { lahiriAyanamsa } from './ayanamsa';
import { moonPosition, planetPosition, rahuPosition, sunPosition } from './bodies';
import { dayNumber, norm360 } from './math';
import { computeRetrograde, ONE_DAY_MS } from './retrograde';

/**
 * The seam between calculation and interpretation. Any implementation that
 * returns ChartFacts (analytic, or the Swiss Ephemeris binding) is a valid
 * drop-in; nothing downstream depends on how the numbers were produced.
 */
export interface Ephemeris {
  readonly id: string;
  compute(input: BirthInput): ChartFacts;
  /**
   * Sidereal longitude for all 9 bodies at an arbitrary UTC instant, with no
   * ascendant/house/dasha computation — for transit use, where only "what
   * sign is this planet in right now" matters, not a fresh chart. Planetary
   * longitude in this codebase is geocentric and needs no reference location.
   */
  siderealPositions(utcMs: number): Record<PlanetName, number>;
}

/** Pure-JS analytic positions (Schlyter). ~arc-minute accuracy; runs anywhere. */
export class AnalyticEphemeris implements Ephemeris {
  readonly id = 'analytic';

  private siderealAt(utcMs: number): { sidereal: Record<PlanetName, number>; sun: ReturnType<typeof sunPosition>; ayanamsa: number; utHours: number; d: number } {
    const { Y, Mo, D, utHours } = utcParts(utcMs);
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

    return { sidereal, sun, ayanamsa, utHours, d };
  }

  compute(input: BirthInput): ChartFacts {
    const { sidereal, sun, ayanamsa, utHours, d } = this.siderealAt(input.utcMs);
    const ascLon = ascendant(d, sun.meanLon, utHours, input.longitude, input.latitude, ayanamsa);
    const previousDay = this.siderealPositions(input.utcMs - ONE_DAY_MS);
    const retrograde = computeRetrograde(sidereal, previousDay);
    return assembleChartFacts(sidereal, ascLon, ayanamsa, input.utcMs, retrograde);
  }

  siderealPositions(utcMs: number): Record<PlanetName, number> {
    return this.siderealAt(utcMs).sidereal;
  }
}

export const analyticEphemeris: Ephemeris = new AnalyticEphemeris();
