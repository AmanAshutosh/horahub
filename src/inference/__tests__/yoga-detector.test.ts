/**
 * Unit tests for yoga-detector.ts
 *
 * Uses synthetic ChartFacts to verify each yoga's formation conditions.
 * No ephemeris, no file I/O.
 */
import { describe, it, expect } from 'vitest';
import { detectYogas } from '../yoga-detector';
import type { ChartFacts } from '@/types/chart';

function makeMinimalFacts(partial: Partial<ChartFacts['planets']> = {}): ChartFacts {
  // Default: planets in neutral positions (spread across houses 1-9)
  const defaults: ChartFacts['planets'] = {
    Sun:     { siderealLon: 30,  sign: 1,  degInSign: 0, house: 2,  nakshatra: 2,  pada: 1, navamsaSign: 1,  dignity: 'neutral' },
    Moon:    { siderealLon: 60,  sign: 2,  degInSign: 0, house: 3,  nakshatra: 4,  pada: 1, navamsaSign: 2,  dignity: 'neutral' },
    Mars:    { siderealLon: 90,  sign: 3,  degInSign: 0, house: 4,  nakshatra: 7,  pada: 1, navamsaSign: 3,  dignity: 'neutral' },
    Mercury: { siderealLon: 120, sign: 4,  degInSign: 0, house: 5,  nakshatra: 10, pada: 1, navamsaSign: 4,  dignity: 'neutral' },
    Jupiter: { siderealLon: 150, sign: 5,  degInSign: 0, house: 6,  nakshatra: 12, pada: 1, navamsaSign: 5,  dignity: 'neutral' },
    Venus:   { siderealLon: 180, sign: 6,  degInSign: 0, house: 7,  nakshatra: 14, pada: 1, navamsaSign: 6,  dignity: 'neutral' },
    Saturn:  { siderealLon: 210, sign: 7,  degInSign: 0, house: 8,  nakshatra: 17, pada: 1, navamsaSign: 7,  dignity: 'neutral' },
    Rahu:    { siderealLon: 240, sign: 8,  degInSign: 0, house: 9,  nakshatra: 18, pada: 1, navamsaSign: 8,  dignity: 'neutral' },
    Ketu:    { siderealLon: 60,  sign: 2,  degInSign: 0, house: 3,  nakshatra: 4,  pada: 1, navamsaSign: 2,  dignity: 'neutral' },
  };
  const planets = { ...defaults, ...partial };

  const houses: ChartFacts['houses'] = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1, sign: i, lord: 'Sun' as const, occupants: [],
  }));

  // Place occupants
  for (const [pName, placement] of Object.entries(planets)) {
    const h = houses[placement.house - 1];
    if (h && !h.occupants.includes(pName as never)) {
      h.occupants.push(pName as never);
    }
  }

  return {
    ayanamsa: 23.85,
    ascendant: { sign: 0, degree: 0 },
    lagnaSign: 0,
    moon: { sign: planets.Moon.sign, nakshatra: planets.Moon.nakshatra, pada: 1 },
    planets,
    houses,
    dasha: {
      periods: [], antardashas: [], currentMahaIndex: 0, currentAntarIndex: 0,
      tree: [], currentPath: { mahaIndex: -1, antarIndex: -1, pratyantarIndex: -1 },
    },
  };
}

describe('detectYogas', () => {
  it('detects Hamsa Yoga when Jupiter is exalted in kendra', () => {
    const facts = makeMinimalFacts({
      // Jupiter exalted (Cancer=sign 3) in house 4 (kendra from Lagna=house 1)
      Jupiter: { siderealLon: 100, sign: 3, degInSign: 5, house: 4, nakshatra: 7, pada: 1, navamsaSign: 3, dignity: 'exalted' },
    });
    const yogas = detectYogas(facts);
    const hamsa = yogas.find((y) => y.name === 'Hamsa Yoga');
    expect(hamsa).toBeDefined();
    expect(hamsa?.planets).toContain('Jupiter');
  });

  it('does NOT detect Hamsa Yoga when Jupiter is not in kendra', () => {
    const facts = makeMinimalFacts({
      // Jupiter exalted but in house 6 (not kendra)
      Jupiter: { siderealLon: 100, sign: 3, degInSign: 5, house: 6, nakshatra: 7, pada: 1, navamsaSign: 3, dignity: 'exalted' },
    });
    const yogas = detectYogas(facts);
    const hamsa = yogas.find((y) => y.name === 'Hamsa Yoga' && y.strength === 'exact');
    expect(hamsa).toBeUndefined();
  });

  it('detects Gajakesari Yoga when Jupiter is in kendra from Moon', () => {
    const facts = makeMinimalFacts({
      // Moon in house 3, Jupiter in house 6 → 4th from Moon (kendra from Moon)
      Moon:    { siderealLon: 60, sign: 2, degInSign: 0, house: 3, nakshatra: 4, pada: 1, navamsaSign: 2, dignity: 'neutral' },
      Jupiter: { siderealLon: 150, sign: 5, degInSign: 0, house: 6, nakshatra: 12, pada: 1, navamsaSign: 5, dignity: 'neutral' },
    });
    const yogas = detectYogas(facts);
    expect(yogas.some((y) => y.name === 'Gajakesari Yoga')).toBe(true);
  });

  it('detects Budha-Aditya Yoga when Sun and Mercury are conjunct', () => {
    const facts = makeMinimalFacts({
      Sun:     { siderealLon: 30, sign: 1, degInSign: 5, house: 2, nakshatra: 2, pada: 1, navamsaSign: 1, dignity: 'neutral' },
      Mercury: { siderealLon: 35, sign: 1, degInSign: 10, house: 2, nakshatra: 2, pada: 2, navamsaSign: 1, dignity: 'own' },
    });
    const yogas = detectYogas(facts);
    expect(yogas.some((y) => y.name === 'Budha-Aditya Yoga')).toBe(true);
  });

  it('does NOT detect Budha-Aditya Yoga when Sun and Mercury are in different houses', () => {
    const facts = makeMinimalFacts(); // defaults: Sun house 2, Mercury house 5
    const yogas = detectYogas(facts);
    expect(yogas.some((y) => y.name === 'Budha-Aditya Yoga')).toBe(false);
  });

  it('returns no duplicate yoga entries', () => {
    const facts = makeMinimalFacts({
      Jupiter: { siderealLon: 100, sign: 3, degInSign: 5, house: 4, nakshatra: 7, pada: 1, navamsaSign: 3, dignity: 'exalted' },
    });
    const yogas = detectYogas(facts);
    const names = yogas.map((y) => y.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  });
});
