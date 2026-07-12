/**
 * Integration test for buildReportBrief (Phase B3) — runs against a real
 * computed chart and the real (filesystem-backed) KB graph, same golden
 * chart used by tests/report-builder.test.ts and tests/ephemeris.test.ts.
 * Structural assertions only (domain/dasha shape, invariants) — exact KB
 * match content is the KB's business, not this layer's.
 */
import { describe, expect, it } from 'vitest';
import { AnalyticEphemeris } from '@/ephemeris';
import { buildReportBrief } from '../report-brief';
import { LIFE_DOMAINS } from '../domain-map';

const facts = new AnalyticEphemeris().compute({
  utcMs: Date.UTC(1998, 7, 15, 9, 0),
  latitude: 28.5355,
  longitude: 77.391,
});

const brief = buildReportBrief(facts);

describe('buildReportBrief', () => {
  it('returns a brief (KB graph is built in this repo)', () => {
    expect(brief).not.toBeNull();
  });

  it('produces exactly one LifeDomainBrief per the 17 defined life domains, in order', () => {
    expect(brief!.lifeDomains.map((d) => d.domain)).toEqual([...LIFE_DOMAINS]);
  });

  it('marks a domain with no KB category (e.g. Business) as hasData: false, never fabricated', () => {
    const business = brief!.lifeDomains.find((d) => d.domain === 'Business');
    expect(business).toBeDefined();
    expect(business!.hasData).toBe(false);
    expect(business!.observations).toHaveLength(0);
  });

  it('every domain has a valid riskLevel and an array (possibly empty) of remedies', () => {
    for (const domain of brief!.lifeDomains) {
      expect(['low', 'medium', 'high']).toContain(domain.riskLevel);
      expect(Array.isArray(domain.remedies)).toBe(true);
    }
  });

  it('a domain with hasData: false always has riskLevel "low" (no signal to base risk on)', () => {
    for (const domain of brief!.lifeDomains) {
      if (!domain.hasData) expect(domain.riskLevel).toBe('low');
    }
  });

  it('builds a windowed mahadasha breakdown including exactly one current period', () => {
    expect(brief!.mahadashas.length).toBeGreaterThan(0);
    const currentCount = brief!.mahadashas.filter((m) => m.isCurrent).length;
    expect(currentCount).toBe(1);
  });

  it('every mahadasha has 9 antardashas, and the current mahadasha has exactly one current antardasha', () => {
    for (const maha of brief!.mahadashas) {
      expect(maha.antardashas).toHaveLength(9);
      if (maha.isCurrent) {
        expect(maha.antardashas.filter((a) => a.isCurrent)).toHaveLength(1);
      } else {
        expect(maha.antardashas.every((a) => !a.isCurrent)).toBe(true);
      }
    }
  });

  it('every antardasha correctly references its parent mahadasha lord', () => {
    for (const maha of brief!.mahadashas) {
      for (const antar of maha.antardashas) {
        expect(antar.parentLord).toBe(maha.lord);
      }
    }
  });

  it('dasha periods never claim to be both current and past', () => {
    for (const maha of brief!.mahadashas) {
      expect(maha.isCurrent && maha.isPast).toBe(false);
      for (const antar of maha.antardashas) {
        expect(antar.isCurrent && antar.isPast).toBe(false);
      }
    }
  });

  it('overallDirection is an array of merged observations, not raw prose', () => {
    expect(Array.isArray(brief!.overallDirection)).toBe(true);
    for (const o of brief!.overallDirection) {
      expect(typeof o.primaryClaim).toBe('string');
      expect(['positive', 'negative', 'neutral']).toContain(o.polarity);
    }
  });
});
