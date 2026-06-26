import { describe, expect, it } from 'vitest';
import { AnalyticEphemeris } from '@/ephemeris';
import { SwissEphemeris } from '@/ephemeris/swiss';
import type { PlanetName } from '@/types/chart';

// Same golden birth used elsewhere: 1998-08-15 09:00 UT, Noida.
const input = { utcMs: Date.UTC(1998, 7, 15, 9, 0), latitude: 28.5355, longitude: 77.391 };
const analytic = new AnalyticEphemeris().compute(input);
const swiss = new SwissEphemeris().compute(input);

const PLANETS: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function angularDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

describe('Swiss Ephemeris adapter agrees with the analytic engine', () => {
  it('produces an identical ChartFacts shape', () => {
    expect(Object.keys(swiss.planets).sort()).toEqual(Object.keys(analytic.planets).sort());
    expect(swiss.houses).toHaveLength(12);
    expect(swiss.dasha.periods).toHaveLength(10);
  });

  it('matches the analytic ayanāṁśa to within 0.01°', () => {
    expect(angularDiff(swiss.ayanamsa, analytic.ayanamsa)).toBeLessThan(0.01);
  });

  it('places Sun, Moon and Lagna in the same signs', () => {
    expect(swiss.planets.Sun.sign).toBe(analytic.planets.Sun.sign);
    expect(swiss.planets.Moon.sign).toBe(analytic.planets.Moon.sign);
    expect(swiss.lagnaSign).toBe(analytic.lagnaSign);
  });

  it('agrees on every graha longitude to within 1.5°', () => {
    for (const p of PLANETS) {
      const diff = angularDiff(swiss.planets[p].siderealLon, analytic.planets[p].siderealLon);
      expect(diff, `${p} differs by ${diff.toFixed(3)}°`).toBeLessThan(1.5);
    }
  });

  it('keeps the Moon nakṣatra identical (so daśā matches)', () => {
    expect(swiss.planets.Moon.nakshatra).toBe(analytic.planets.Moon.nakshatra);
    expect(swiss.dasha.periods[0]?.lord).toBe(analytic.dasha.periods[0]?.lord);
  });
});
