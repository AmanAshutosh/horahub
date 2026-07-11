/**
 * Unit tests for condition-checker.ts
 *
 * These tests use a synthetic ChartFacts that is built inline. No ephemeris,
 * no file I/O, no KB access — pure function testing.
 */
import { describe, it, expect } from 'vitest';
import { checkCondition, checkAllConditions } from '../condition-checker';
import type { ChartFacts } from '@/types/chart';
import type { RuleCondition } from '../../../scripts/kb-lib/rule-schema';

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeFacts(overrides: Partial<ChartFacts> = {}): ChartFacts {
  const base: ChartFacts = {
    ayanamsa: 23.85,
    ascendant: { sign: 0, degree: 15 },    // Aries lagna
    lagnaSign: 0,
    moon: { sign: 3, nakshatra: 3, pada: 2 }, // Cancer moon, Rohini
    planets: {
      Sun:     { siderealLon: 155, sign: 4, degInSign: 5,  house: 5,  nakshatra: 11, pada: 2, navamsaSign: 0,  dignity: 'own' },
      Moon:    { siderealLon: 100, sign: 3, degInSign: 10, house: 4,  nakshatra: 3,  pada: 2, navamsaSign: 3,  dignity: 'exalted' },
      Mars:    { siderealLon: 270, sign: 9, degInSign: 0,  house: 10, nakshatra: 19, pada: 1, navamsaSign: 9,  dignity: 'exalted' },
      Mercury: { siderealLon: 165, sign: 5, degInSign: 15, house: 6,  nakshatra: 12, pada: 3, navamsaSign: 5,  dignity: 'exalted' },
      Jupiter: { siderealLon: 90,  sign: 3, degInSign: 1,  house: 4,  nakshatra: 7,  pada: 4, navamsaSign: 3,  dignity: 'exalted' },
      Venus:   { siderealLon: 180, sign: 6, degInSign: 0,  house: 7,  nakshatra: 15, pada: 2, navamsaSign: 6,  dignity: 'own' },
      Saturn:  { siderealLon: 300, sign: 10, degInSign: 0, house: 11, nakshatra: 24, pada: 1, navamsaSign: 10, dignity: 'own' },
      Rahu:    { siderealLon: 60,  sign: 2, degInSign: 0,  house: 3,  nakshatra: 5,  pada: 1, navamsaSign: 2,  dignity: 'neutral' },
      Ketu:    { siderealLon: 240, sign: 8, degInSign: 0,  house: 9,  nakshatra: 17, pada: 3, navamsaSign: 8,  dignity: 'neutral' },
    },
    houses: [
      { house: 1,  sign: 0,  lord: 'Mars',    occupants: [] },
      { house: 2,  sign: 1,  lord: 'Venus',   occupants: [] },
      { house: 3,  sign: 2,  lord: 'Mercury', occupants: ['Rahu'] },
      { house: 4,  sign: 3,  lord: 'Moon',    occupants: ['Moon', 'Jupiter'] },
      { house: 5,  sign: 4,  lord: 'Sun',     occupants: ['Sun'] },
      { house: 6,  sign: 5,  lord: 'Mercury', occupants: ['Mercury'] },
      { house: 7,  sign: 6,  lord: 'Venus',   occupants: ['Venus'] },
      { house: 8,  sign: 7,  lord: 'Mars',    occupants: [] },
      { house: 9,  sign: 8,  lord: 'Jupiter', occupants: ['Ketu'] },
      { house: 10, sign: 9,  lord: 'Saturn',  occupants: ['Mars'] },
      { house: 11, sign: 10, lord: 'Saturn',  occupants: ['Saturn'] },
      { house: 12, sign: 11, lord: 'Jupiter', occupants: [] },
    ],
    dasha: {
      periods: [
        { lord: 'Mars',    startMs: Date.now() - 7 * 365.25 * 86400000, endMs: Date.now() - 0.1 * 86400000, years: 7 },
        { lord: 'Rahu',    startMs: Date.now() - 0.1 * 86400000, endMs: Date.now() + 18 * 365.25 * 86400000, years: 18, partial: false },
        { lord: 'Jupiter', startMs: Date.now() + 18 * 365.25 * 86400000, endMs: Date.now() + 34 * 365.25 * 86400000, years: 16 },
      ],
      antardashas: [
        { lord: 'Rahu',    startMs: Date.now() - 0.1 * 86400000, endMs: Date.now() + 2 * 365.25 * 86400000, years: 18 },
        { lord: 'Jupiter', startMs: Date.now() + 2 * 365.25 * 86400000, endMs: Date.now() + 5 * 365.25 * 86400000, years: 16 },
      ],
      currentMahaIndex: 1, // Rahu
      currentAntarIndex: 0, // Rahu-Rahu
      tree: [],
      currentPath: { mahaIndex: -1, antarIndex: -1, pratyantarIndex: -1 },
    },
  };
  return { ...base, ...overrides };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('checkCondition', () => {
  const facts = makeFacts();

  describe('planet-in-house', () => {
    it('returns true when planet is in the specified house', () => {
      const cond: RuleCondition = { type: 'planet-in-house', planet: 'Mars', house: 10, raw: 'Mars in 10th' };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when planet is not in the specified house', () => {
      const cond: RuleCondition = { type: 'planet-in-house', planet: 'Mars', house: 1, raw: 'Mars in 1st' };
      expect(checkCondition(cond, facts)).toBe(false);
    });

    it('returns false when planet is missing', () => {
      const cond: RuleCondition = { type: 'planet-in-house', house: 10, raw: 'in 10th' };
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });

  describe('planet-in-sign', () => {
    it('returns true when planet is in the specified sign', () => {
      const cond: RuleCondition = { type: 'planet-in-sign', planet: 'Moon', sign: 'Cancer', raw: 'Moon in Cancer' };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when planet is not in the specified sign', () => {
      const cond: RuleCondition = { type: 'planet-in-sign', planet: 'Moon', sign: 'Aries', raw: 'Moon in Aries' };
      expect(checkCondition(cond, facts)).toBe(false);
    });

    it('returns false for unknown sign name', () => {
      const cond: RuleCondition = { type: 'planet-in-sign', planet: 'Moon', sign: 'Atlantis', raw: 'Moon in Atlantis' };
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });

  describe('planet-dignity', () => {
    it('returns true when planet has specified dignity', () => {
      const cond: RuleCondition = { type: 'planet-dignity', planet: 'Moon', dignity: 'exalted', raw: 'Moon exalted' };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when dignity does not match', () => {
      const cond: RuleCondition = { type: 'planet-dignity', planet: 'Moon', dignity: 'debilitated', raw: 'Moon debilitated' };
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });

  describe('planet-aspect', () => {
    it('returns true when aspecting planet casts 7th aspect onto target', () => {
      // Jupiter at sign 3 (Cancer) — 7th aspect lands on sign 9 (Capricorn)
      // Saturn is at sign 10 (Aquarius), not sign 9
      // Mars at sign 9 (Capricorn) — YES Jupiter aspects Mars
      const cond: RuleCondition = {
        type: 'planet-aspect', planet: 'Mars', aspectingPlanet: 'Jupiter', raw: 'Jupiter aspects Mars',
      };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when planet does not aspect target', () => {
      const cond: RuleCondition = {
        type: 'planet-aspect', planet: 'Venus', aspectingPlanet: 'Moon', raw: 'Moon aspects Venus',
      };
      // Moon at sign 3 — 7th aspect sign 9 (Capricorn). Venus at sign 6. Not aspected.
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });

  describe('dasha-period', () => {
    it('returns true for the current mahadasha lord', () => {
      const cond: RuleCondition = { type: 'dasha-period', planet: 'Rahu', raw: 'in Rahu dasha' };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when not in specified dasha', () => {
      const cond: RuleCondition = { type: 'dasha-period', planet: 'Jupiter', raw: 'in Jupiter dasha' };
      expect(checkCondition(cond, facts)).toBe(false);
    });

    it('returns true when mahadasha AND antardasha match', () => {
      const cond: RuleCondition = {
        type: 'dasha-period', planet: 'Rahu', antardashaPlanet: 'Rahu', raw: 'Rahu-Rahu',
      };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when antardasha does not match', () => {
      const cond: RuleCondition = {
        type: 'dasha-period', planet: 'Rahu', antardashaPlanet: 'Saturn', raw: 'Rahu-Saturn',
      };
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });

  describe('nakshatra-placement', () => {
    it('returns true when planet is in the specified nakshatra', () => {
      // Moon at nakshatra index 3 = Rohini
      const cond: RuleCondition = { type: 'nakshatra-placement', planet: 'Moon', nakshatra: 'Rohini', raw: 'Moon in Rohini' };
      expect(checkCondition(cond, facts)).toBe(true);
    });

    it('returns false when planet is in a different nakshatra', () => {
      const cond: RuleCondition = { type: 'nakshatra-placement', planet: 'Moon', nakshatra: 'Ashwini', raw: 'Moon in Ashwini' };
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });

  describe('yoga-presence', () => {
    it('returns true when yoga name is in the detected set', () => {
      const yoga = new Set(['Gajakesari Yoga']);
      const cond: RuleCondition = { type: 'yoga-presence', yoga: 'Gajakesari Yoga', raw: 'Gajakesari' };
      expect(checkCondition(cond, facts, yoga)).toBe(true);
    });

    it('returns false when yoga is not detected', () => {
      const yoga = new Set<string>();
      const cond: RuleCondition = { type: 'yoga-presence', yoga: 'Gajakesari Yoga', raw: 'Gajakesari' };
      expect(checkCondition(cond, facts, yoga)).toBe(false);
    });
  });

  describe('unstructured', () => {
    it('always returns false', () => {
      const cond: RuleCondition = { type: 'unstructured', raw: 'some text' };
      expect(checkCondition(cond, facts)).toBe(false);
    });
  });
});

describe('checkAllConditions', () => {
  const facts = makeFacts();

  it('returns false for empty conditions array', () => {
    expect(checkAllConditions([], facts)).toBe(false);
  });

  it('returns true only when ALL conditions pass', () => {
    const conds: RuleCondition[] = [
      { type: 'planet-in-house', planet: 'Mars', house: 10, raw: 'Mars in 10th' },
      { type: 'planet-dignity', planet: 'Mars', dignity: 'exalted', raw: 'Mars exalted' },
    ];
    expect(checkAllConditions(conds, facts)).toBe(true);
  });

  it('returns false when one condition fails', () => {
    const conds: RuleCondition[] = [
      { type: 'planet-in-house', planet: 'Mars', house: 10, raw: 'Mars in 10th' },
      { type: 'planet-in-house', planet: 'Mars', house: 1, raw: 'Mars in 1st' }, // false
    ];
    expect(checkAllConditions(conds, facts)).toBe(false);
  });
});
