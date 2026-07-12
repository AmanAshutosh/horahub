import { describe, it, expect } from 'vitest';
import { buildLifeDomainPrompt } from '../life-domain';
import { buildMahadashaPrompt, buildAntardashaPrompt } from '../dasha-breakdown';
import { buildOverviewPrompt } from '../overview';
import { formatObservations, formatSourceTexts } from '../format';
import type { LifeDomainBrief, MahadashaBrief, AntardashaBrief, ReportBrief } from '@/narrative';
import type { MergedObservation } from '@/narrative';

function mergedObs(overrides: Partial<MergedObservation> = {}): MergedObservation {
  return {
    domain: 'Career',
    topicKey: 'Career::promotion',
    primaryClaim: 'Career is entering a growth phase',
    polarity: 'positive',
    strengthTier: 'natal',
    confidence: 0.8,
    nuance: [],
    corroboration: [],
    supportingObservationIds: ['obs:1'],
    contributingRuleIds: ['r1'],
    ...overrides,
  };
}

describe('buildLifeDomainPrompt', () => {
  it('returns null when the domain has no data — never spend a call on nothing', () => {
    const brief: LifeDomainBrief = { domain: 'Business', hasData: false, observations: [], remedies: [], riskLevel: 'low' };
    expect(buildLifeDomainPrompt(brief)).toBeNull();
  });

  it('includes the domain name, observations, and risk level when there is data', () => {
    const brief: LifeDomainBrief = {
      domain: 'Career', hasData: true, observations: [mergedObs()], remedies: [], riskLevel: 'medium',
    };
    const prompt = buildLifeDomainPrompt(brief)!;
    expect(prompt).toContain('Career');
    expect(prompt).toContain('Career is entering a growth phase');
    expect(prompt).toContain('medium');
  });

  it('never leaks raw ChartFacts-shaped keys (siderealLon, house, dignity) into the prompt', () => {
    const brief: LifeDomainBrief = {
      domain: 'Career', hasData: true, observations: [mergedObs()], remedies: [], riskLevel: 'low',
    };
    const prompt = buildLifeDomainPrompt(brief)!;
    expect(prompt).not.toMatch(/siderealLon|dignity|navamsaSign/);
  });
});

describe('buildMahadashaPrompt / buildAntardashaPrompt', () => {
  const baseMaha: MahadashaBrief = {
    lord: 'Jupiter', startMs: Date.UTC(2020, 0, 1), endMs: Date.UTC(2036, 0, 1),
    isCurrent: true, isPast: false, sourceTexts: [], contributingRuleIds: [], antardashas: [],
  };

  it('returns null for a mahadasha with no classical source texts', () => {
    expect(buildMahadashaPrompt(baseMaha)).toBeNull();
  });

  it('includes the lord name and formatted period when source texts are present', () => {
    const brief: MahadashaBrief = { ...baseMaha, sourceTexts: ['Jupiter brings wisdom and expansion.'] };
    const prompt = buildMahadashaPrompt(brief)!;
    expect(prompt).toContain('Jupiter');
    expect(prompt).toContain('Jupiter brings wisdom and expansion.');
    expect(prompt).toContain('CURRENT');
  });

  it('antardasha prompt returns null with no source texts, and references its parent lord otherwise', () => {
    const antar: AntardashaBrief = {
      lord: 'Venus', startMs: Date.UTC(2021, 0, 1), endMs: Date.UTC(2023, 0, 1),
      isCurrent: false, isPast: true, sourceTexts: [], contributingRuleIds: [], parentLord: 'Jupiter',
    };
    expect(buildAntardashaPrompt(antar)).toBeNull();

    const withData: AntardashaBrief = { ...antar, sourceTexts: ['Venus refines relationships.'] };
    const prompt = buildAntardashaPrompt(withData, 'A period of growth and learning')!;
    expect(prompt).toContain('Jupiter');
    expect(prompt).toContain('Venus refines relationships.');
    expect(prompt).toContain('A period of growth and learning');
  });
});

describe('buildOverviewPrompt', () => {
  it('returns null when there is no cross-domain synthesis data', () => {
    const brief: ReportBrief = { computedAt: new Date().toISOString(), lifeDomains: [], mahadashas: [], overallDirection: [] };
    expect(buildOverviewPrompt(brief)).toBeNull();
  });

  it('includes the current mahadasha/antardasha period when present', () => {
    const antar: AntardashaBrief = {
      lord: 'Venus', startMs: Date.UTC(2021, 0, 1), endMs: Date.UTC(2023, 0, 1),
      isCurrent: true, isPast: false, sourceTexts: [], contributingRuleIds: [], parentLord: 'Jupiter',
    };
    const maha: MahadashaBrief = {
      lord: 'Jupiter', startMs: Date.UTC(2020, 0, 1), endMs: Date.UTC(2036, 0, 1),
      isCurrent: true, isPast: false, sourceTexts: [], contributingRuleIds: [], antardashas: [antar],
    };
    const brief: ReportBrief = {
      computedAt: new Date().toISOString(),
      lifeDomains: [],
      mahadashas: [maha],
      overallDirection: [mergedObs({ domain: 'Overall Life Direction' })],
    };
    const prompt = buildOverviewPrompt(brief)!;
    expect(prompt).toContain('Jupiter');
    expect(prompt).toContain('Venus');
  });
});

describe('format helpers', () => {
  it('formatObservations reports "(no data available)" for an empty list rather than an empty string', () => {
    expect(formatObservations([])).toBe('(no data available)');
  });

  it('formatSourceTexts reports "(no classical text data available...)" for an empty list', () => {
    expect(formatSourceTexts([])).toMatch(/no classical text data/);
  });
});
