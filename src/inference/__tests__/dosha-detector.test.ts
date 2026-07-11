/**
 * Unit tests for dosha-detector.ts
 *
 * Uses synthetic ChartFacts to verify each dosha's formation and cancellation
 * conditions. No ephemeris, no file I/O.
 */
import { describe, it, expect } from 'vitest';
import { detectDoshas } from '../dosha-detector';
import type { ChartFacts } from '@/types/chart';

/** Default: Mars and the Rahu/Ketu axis placed so NEITHER dosha fires. */
function makeMinimalFacts(partial: Partial<ChartFacts['planets']> = {}): ChartFacts {
  const defaults: ChartFacts['planets'] = {
    Sun:     { siderealLon: 10,  sign: 0,  degInSign: 10, house: 1, nakshatra: 0, pada: 1, navamsaSign: 0, dignity: 'neutral' },
    Moon:    { siderealLon: 175, sign: 5,  degInSign: 25, house: 6, nakshatra: 12, pada: 1, navamsaSign: 5, dignity: 'neutral' },
    Mars:    { siderealLon: 70,  sign: 2,  degInSign: 10, house: 3, nakshatra: 7,  pada: 1, navamsaSign: 2, dignity: 'neutral' },
    Mercury: { siderealLon: 250, sign: 8,  degInSign: 10, house: 9, nakshatra: 18, pada: 1, navamsaSign: 8, dignity: 'neutral' },
    Jupiter: { siderealLon: 130, sign: 4,  degInSign: 10, house: 5, nakshatra: 10, pada: 1, navamsaSign: 4, dignity: 'neutral' },
    Venus:   { siderealLon: 290, sign: 9,  degInSign: 20, house: 10, nakshatra: 22, pada: 1, navamsaSign: 9, dignity: 'neutral' },
    Saturn:  { siderealLon: 320, sign: 10, degInSign: 20, house: 11, nakshatra: 24, pada: 1, navamsaSign: 10, dignity: 'neutral' },
    Rahu:    { siderealLon: 0,   sign: 0,  degInSign: 0,  house: 1, nakshatra: 0, pada: 1, navamsaSign: 0, dignity: 'neutral' },
    Ketu:    { siderealLon: 180, sign: 6,  degInSign: 0,  house: 7, nakshatra: 13, pada: 1, navamsaSign: 6, dignity: 'neutral' },
  };
  const planets = { ...defaults, ...partial };

  const houses: ChartFacts['houses'] = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1, sign: i, lord: 'Sun' as const, occupants: [],
  }));
  for (const [pName, placement] of Object.entries(planets)) {
    const h = houses[placement.house - 1];
    if (h && !h.occupants.includes(pName as never)) h.occupants.push(pName as never);
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

describe('detectDoshas — Mangal Dosha', () => {
  it('does not fire when Mars is outside the dosha houses from both Lagna and Moon', () => {
    const doshas = detectDoshas(makeMinimalFacts());
    expect(doshas.some((d) => d.name === 'Mangal Dosha')).toBe(false);
  });

  it('fires when Mars is in a dosha house (e.g. 8th) from Lagna', () => {
    const facts = makeMinimalFacts({
      Mars: { siderealLon: 220, sign: 7, degInSign: 10, house: 8, nakshatra: 17, pada: 1, navamsaSign: 7, dignity: 'neutral' },
    });
    const doshas = detectDoshas(facts);
    const mangal = doshas.find((d) => d.name === 'Mangal Dosha');
    expect(mangal).toBeDefined();
    expect(mangal?.severity).toBe('medium');
    expect(mangal?.cancellationReasons).toHaveLength(0);
  });

  it('is cancelled when Mars is exalted or in its own sign in the dosha house', () => {
    const facts = makeMinimalFacts({
      // Mars exalted in Capricorn (sign 9), placed in house 8
      Mars: { siderealLon: 279, sign: 9, degInSign: 9, house: 8, nakshatra: 23, pada: 1, navamsaSign: 9, dignity: 'exalted' },
    });
    const doshas = detectDoshas(facts);
    const mangal = doshas.find((d) => d.name === 'Mangal Dosha');
    expect(mangal).toBeDefined();
    expect(mangal?.severity).toBe('cancelled');
    expect(mangal?.cancellationReasons.length).toBeGreaterThan(0);
  });

  it('is cancelled when Jupiter is conjunct Mars in the dosha house', () => {
    const facts = makeMinimalFacts({
      Mars:    { siderealLon: 220, sign: 7, degInSign: 10, house: 8, nakshatra: 17, pada: 1, navamsaSign: 7, dignity: 'neutral' },
      Jupiter: { siderealLon: 225, sign: 7, degInSign: 15, house: 8, nakshatra: 17, pada: 2, navamsaSign: 7, dignity: 'neutral' },
    });
    const doshas = detectDoshas(facts);
    const mangal = doshas.find((d) => d.name === 'Mangal Dosha');
    expect(mangal?.severity).toBe('cancelled');
    expect(mangal?.cancellationReasons.some((r) => r.includes('Jupiter'))).toBe(true);
  });
});

describe('detectDoshas — Kaal Sarp Dosha', () => {
  it('does not fire when the classical grahas are spread on both sides of the Rahu-Ketu axis', () => {
    const doshas = detectDoshas(makeMinimalFacts());
    expect(doshas.some((d) => d.name.startsWith('Kaal Sarp'))).toBe(false);
  });

  it('fires (full) when all 7 classical grahas fall on one side of the axis', () => {
    const facts = makeMinimalFacts({
      Rahu:    { siderealLon: 0,   sign: 0, degInSign: 0,  house: 1, nakshatra: 0,  pada: 1, navamsaSign: 0, dignity: 'neutral' },
      Ketu:    { siderealLon: 180, sign: 6, degInSign: 0,  house: 7, nakshatra: 13, pada: 1, navamsaSign: 6, dignity: 'neutral' },
      Sun:     { siderealLon: 10,  sign: 0, degInSign: 10, house: 1, nakshatra: 0,  pada: 1, navamsaSign: 0, dignity: 'neutral' },
      Moon:    { siderealLon: 30,  sign: 1, degInSign: 0,  house: 2, nakshatra: 2,  pada: 1, navamsaSign: 1, dignity: 'neutral' },
      Mars:    { siderealLon: 50,  sign: 1, degInSign: 20, house: 2, nakshatra: 3,  pada: 1, navamsaSign: 1, dignity: 'neutral' },
      Mercury: { siderealLon: 70,  sign: 2, degInSign: 10, house: 3, nakshatra: 5,  pada: 1, navamsaSign: 2, dignity: 'neutral' },
      Jupiter: { siderealLon: 90,  sign: 3, degInSign: 0,  house: 4, nakshatra: 6,  pada: 1, navamsaSign: 3, dignity: 'neutral' },
      Venus:   { siderealLon: 110, sign: 3, degInSign: 20, house: 4, nakshatra: 8,  pada: 1, navamsaSign: 3, dignity: 'neutral' },
      Saturn:  { siderealLon: 170, sign: 5, degInSign: 20, house: 6, nakshatra: 11, pada: 1, navamsaSign: 5, dignity: 'neutral' },
    });
    const doshas = detectDoshas(facts);
    const kaalSarp = doshas.find((d) => d.name.startsWith('Kaal Sarp'));
    expect(kaalSarp).toBeDefined();
    expect(kaalSarp?.name).toContain('Anant'); // Rahu in house 1
    expect(kaalSarp?.severity).toBe('medium');
  });

  it('fires as "partial" when exactly one graha breaks an otherwise one-sided pattern', () => {
    const facts = makeMinimalFacts({
      Rahu:    { siderealLon: 0,   sign: 0, degInSign: 0,  house: 1, nakshatra: 0,  pada: 1, navamsaSign: 0, dignity: 'neutral' },
      Ketu:    { siderealLon: 180, sign: 6, degInSign: 0,  house: 7, nakshatra: 13, pada: 1, navamsaSign: 6, dignity: 'neutral' },
      Sun:     { siderealLon: 10,  sign: 0, degInSign: 10, house: 1, nakshatra: 0,  pada: 1, navamsaSign: 0, dignity: 'neutral' },
      Moon:    { siderealLon: 30,  sign: 1, degInSign: 0,  house: 2, nakshatra: 2,  pada: 1, navamsaSign: 1, dignity: 'neutral' },
      Mars:    { siderealLon: 50,  sign: 1, degInSign: 20, house: 2, nakshatra: 3,  pada: 1, navamsaSign: 1, dignity: 'neutral' },
      Mercury: { siderealLon: 70,  sign: 2, degInSign: 10, house: 3, nakshatra: 5,  pada: 1, navamsaSign: 2, dignity: 'neutral' },
      Jupiter: { siderealLon: 90,  sign: 3, degInSign: 0,  house: 4, nakshatra: 6,  pada: 1, navamsaSign: 3, dignity: 'neutral' },
      Venus:   { siderealLon: 110, sign: 3, degInSign: 20, house: 4, nakshatra: 8,  pada: 1, navamsaSign: 3, dignity: 'neutral' },
      // Saturn alone breaks the pattern, sitting on the other side of the axis
      Saturn:  { siderealLon: 250, sign: 8, degInSign: 10, house: 9, nakshatra: 18, pada: 1, navamsaSign: 8, dignity: 'neutral' },
    });
    const doshas = detectDoshas(facts);
    const kaalSarp = doshas.find((d) => d.name.startsWith('Kaal Sarp'));
    expect(kaalSarp).toBeDefined();
    expect(kaalSarp?.name).toContain('partial');
    expect(kaalSarp?.severity).toBe('low');
  });
});
