/**
 * Regression tests for the (documented-partial) Shadbala engine.
 *
 * These lock in directional correctness — a stronger placement should never
 * score lower than a weaker one — rather than exact classical rupa values,
 * since this engine is an explicit partial approximation (see shadbala.ts's
 * module doc for scope).
 */
import { describe, it, expect } from 'vitest';
import { computeShadbala } from '../shadbala';
import type { PlanetName, PlanetPlacement } from '@/types/chart';

function place(siderealLon: number, house: number, retrograde?: boolean): PlanetPlacement {
  const sign = Math.floor(siderealLon / 30) % 12;
  return {
    siderealLon, sign, degInSign: siderealLon % 30, house,
    nakshatra: 0, pada: 1, navamsaSign: 0, dignity: 'neutral', retrograde,
  };
}

function basePlanets(): Record<PlanetName, PlanetPlacement> {
  return {
    Sun: place(10, 2), Moon: place(40, 3), Mars: place(70, 4), Mercury: place(100, 5),
    Jupiter: place(130, 6), Venus: place(160, 7), Saturn: place(190, 8), Rahu: place(220, 9), Ketu: place(40, 3),
  };
}

describe('computeShadbala', () => {
  it('scores every classical graha (Sun..Saturn) but not the lunar nodes', () => {
    const result = computeShadbala(basePlanets());
    expect(Object.keys(result).sort()).toEqual(
      ['Jupiter', 'Mars', 'Mercury', 'Moon', 'Saturn', 'Sun', 'Venus'].sort(),
    );
  });

  it('Uchcha Bala (via sthanaBala) is higher at the exaltation point than at the debilitation point', () => {
    const exalted = computeShadbala({ ...basePlanets(), Sun: place(10, 2) }); // Sun exalted at 10 deg Aries
    const debilitated = computeShadbala({ ...basePlanets(), Sun: place(190, 2) }); // Sun debilitated at 10 deg Libra
    expect(exalted.Sun!.sthanaBala).toBeGreaterThan(debilitated.Sun!.sthanaBala);
  });

  it('Kendradi Bala is higher in a kendra house than in an apoklima house, all else equal', () => {
    const kendra = computeShadbala({ ...basePlanets(), Jupiter: place(130, 1) }); // house 1 = kendra
    const apoklima = computeShadbala({ ...basePlanets(), Jupiter: place(130, 3) }); // house 3 = apoklima
    expect(kendra.Jupiter!.sthanaBala).toBeGreaterThan(apoklima.Jupiter!.sthanaBala);
  });

  it('Dig Bala peaks at each graha\'s strongest house and is lowest at the opposite house', () => {
    // Saturn is strongest in house 7, weakest in house 1.
    const strongest = computeShadbala({ ...basePlanets(), Saturn: place(190, 7) });
    const weakest = computeShadbala({ ...basePlanets(), Saturn: place(190, 1) });
    expect(strongest.Saturn!.digBala).toBe(60);
    expect(weakest.Saturn!.digBala).toBe(0);
  });

  it('Chesta Bala is higher for a retrograde graha than a direct one in the same position', () => {
    const retro = computeShadbala({ ...basePlanets(), Mars: place(70, 4, true) });
    const direct = computeShadbala({ ...basePlanets(), Mars: place(70, 4, false) });
    expect(retro.Mars!.chestaBala).toBeGreaterThan(direct.Mars!.chestaBala);
  });

  it('Chesta Bala is zero for Sun and Moon, which have no classical Chesta Bala', () => {
    const result = computeShadbala(basePlanets());
    expect(result.Sun!.chestaBala).toBe(0);
    expect(result.Moon!.chestaBala).toBe(0);
  });

  it('Naisargika Bala matches the fixed classical constants exactly, regardless of placement', () => {
    const a = computeShadbala(basePlanets());
    const b = computeShadbala({ ...basePlanets(), Sun: place(250, 11) });
    expect(a.Sun!.naisargikaBala).toBe(60);
    expect(a.Saturn!.naisargikaBala).toBeCloseTo(8.57, 2);
    expect(b.Sun!.naisargikaBala).toBe(a.Sun!.naisargikaBala);
  });

  it('every result is flagged isPartial so callers cannot mistake it for a full classical calculation', () => {
    const result = computeShadbala(basePlanets());
    for (const graha of Object.values(result)) {
      expect(graha!.isPartial).toBe(true);
    }
  });
});
