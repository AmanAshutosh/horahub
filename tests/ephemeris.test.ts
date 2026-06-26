import { describe, expect, it } from 'vitest';
import { AnalyticEphemeris } from '@/ephemeris';
import { RASHI_SHORT } from '@/constants/astro';

const eph = new AnalyticEphemeris();

// Golden case: 1998-08-15 14:30 IST (UT 09:00), Noida 28.5355°N 77.391°E.
// Verified against the standalone engine: Lagna Scorpio, Sun sidereal Cancer,
// Moon sidereal Taurus / Krittika-Rohini boundary region.
const facts = eph.compute({
  utcMs: Date.UTC(1998, 7, 15, 9, 0),
  latitude: 28.5355,
  longitude: 77.391,
});

describe('AnalyticEphemeris golden chart', () => {
  it('positions the ascendant in Scorpio', () => {
    expect(RASHI_SHORT[facts.lagnaSign]).toBe('Sco');
  });

  it('places the Sun in sidereal Cancer', () => {
    expect(RASHI_SHORT[facts.planets.Sun.sign]).toBe('Can');
  });

  it('keeps ayanāṁśa near the expected Lahiri value for 1998', () => {
    expect(facts.ayanamsa).toBeGreaterThan(23.7);
    expect(facts.ayanamsa).toBeLessThan(24.0);
  });

  it('places exactly nine grahas, each in a valid house', () => {
    const planets = Object.values(facts.planets);
    expect(planets).toHaveLength(9);
    for (const p of planets) {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it('keeps Rāhu and Ketu exactly opposite', () => {
    const diff = Math.abs(facts.planets.Rahu.sign - facts.planets.Ketu.sign);
    expect(diff).toBe(6);
  });

  it('builds a 10-period Vimśottari sequence', () => {
    expect(facts.dasha.periods).toHaveLength(10);
    expect(facts.dasha.periods[0]?.partial).toBe(true);
  });
});
