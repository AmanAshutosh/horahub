import { describe, expect, it } from 'vitest';
import { AnalyticEphemeris } from '@/ephemeris';
import { computeTransitPositions, matchTransitRules, TRANSIT_PLANETS } from '@/inference/transit';
import { getRuleIndex } from '@/inference/loader';

// Same golden chart as tests/ephemeris.test.ts.
const facts = new AnalyticEphemeris().compute({
  utcMs: Date.UTC(1998, 7, 15, 9, 0),
  latitude: 28.5355,
  longitude: 77.391,
});

describe('computeTransitPositions', () => {
  it('returns exactly the 4 classical transit planets', () => {
    const positions = computeTransitPositions(facts);
    expect(positions).toHaveLength(4);
    expect(positions.map((p) => p.planet).sort()).toEqual([...TRANSIT_PLANETS].sort());
  });

  it('places every planet in a valid house from both Lagna and Moon', () => {
    const positions = computeTransitPositions(facts);
    for (const p of positions) {
      expect(p.sign).toBeGreaterThanOrEqual(0);
      expect(p.sign).toBeLessThanOrEqual(11);
      expect(p.houseFromLagna).toBeGreaterThanOrEqual(1);
      expect(p.houseFromLagna).toBeLessThanOrEqual(12);
      expect(p.houseFromMoon).toBeGreaterThanOrEqual(1);
      expect(p.houseFromMoon).toBeLessThanOrEqual(12);
    }
  });

  it('keeps Rahu and Ketu exactly opposite', () => {
    const positions = computeTransitPositions(facts);
    const rahu = positions.find((p) => p.planet === 'Rahu')!;
    const ketu = positions.find((p) => p.planet === 'Ketu')!;
    expect(Math.abs(rahu.sign - ketu.sign)).toBe(6);
  });

  it('is deterministic for a fixed instant', () => {
    const fixedMs = Date.UTC(2026, 0, 1, 0, 0);
    const a = computeTransitPositions(facts, fixedMs);
    const b = computeTransitPositions(facts, fixedMs);
    expect(a).toEqual(b);
  });
});

describe('matchTransitRules', () => {
  it('never throws and only returns rules that exist in the rule index', () => {
    const positions = computeTransitPositions(facts);
    const matches = matchTransitRules(positions);
    const ruleIndex = getRuleIndex();
    for (const m of matches) {
      expect(ruleIndex.has(m.ruleId)).toBe(true);
      expect(m.sourceText.trim().length).toBeGreaterThan(0);
    }
    // Match count legitimately varies day to day — not asserted to a fixed number.
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  it('every match names one of the transiting planets in its dimensions', () => {
    const positions = computeTransitPositions(facts);
    const matches = matchTransitRules(positions);
    const ruleIndex = getRuleIndex();
    for (const m of matches) {
      const rule = ruleIndex.get(m.ruleId)!;
      const namesTransitPlanet = positions.some((p) => rule.dimensions.planets.includes(p.planet));
      expect(namesTransitPlanet).toBe(true);
    }
  });
});
