/**
 * Unit tests for observation-compiler.ts (Phase B1).
 *
 * Uses a minimal synthetic InferenceResult fixture rather than running the
 * full KB-backed inference pipeline — this module is a pure projection and
 * should be testable without the filesystem-backed knowledge graph.
 */
import { describe, it, expect } from 'vitest';
import { compileObservations } from '../observation-compiler';
import type { InferenceResult, MatchedRule, DetectedYoga, DetectedDosha, TimelineEvent } from '@/inference/types';

function makeMatch(overrides: Partial<MatchedRule> = {}): MatchedRule {
  return {
    ruleId: 'BPHS_CH1_V1_R001',
    book: 'Brihat Parashara Hora Shastra',
    bookCode: 'BPHS',
    chapter: '1',
    verse: '1',
    page: 1,
    priority: 1,
    categories: ['career'],
    sourceText: 'A strong tenth lord brings success in profession.',
    matchType: 'structured',
    matchedConditionRaws: [],
    effectDirection: 'increase',
    effectDomain: 'career',
    confidence: 0.8,
    extractionConfidence: 0.9,
    validationConfidence: null,
    conflictingRuleIds: [],
    corroboratingRuleIds: [],
    hasRemedy: false,
    hasTiming: false,
    isComposite: false,
    ...overrides,
  };
}

function makeResult(overrides: Partial<InferenceResult> = {}): InferenceResult {
  return {
    computedAt: new Date().toISOString(),
    totalRulesEvaluated: 100,
    totalMatched: 1,
    structuredMatched: 1,
    dimensionMatched: 0,
    domains: [],
    yogas: [],
    doshas: [],
    timeline: [],
    remedies: [],
    pastObservations: [],
    transit: null,
    ...overrides,
  };
}

describe('compileObservations — domain matches', () => {
  it('maps a KB category match to its narrative-layer domain label', () => {
    const result = makeResult({
      domains: [{ domain: 'career', matchCount: 1, structuredCount: 1, dimensionCount: 0, matches: [makeMatch()], remedyCandidates: [] }],
    });
    const observations = compileObservations(result);
    expect(observations).toHaveLength(1);
    expect(observations[0]!.domain).toBe('Career');
    expect(observations[0]!.sourceText).toBe('A strong tenth lord brings success in profession.');
    expect(observations[0]!.polarity).toBe('positive');
    expect(observations[0]!.strengthTier).toBe('natal');
    expect(observations[0]!.sourceKind).toBe('kb-rule');
  });

  it('skips the "yogas" pseudo-domain and any KB category with no domain mapping', () => {
    const result = makeResult({
      domains: [
        { domain: 'yogas', matchCount: 1, structuredCount: 0, dimensionCount: 1, matches: [makeMatch()], remedyCandidates: [] },
        { domain: 'remedies', matchCount: 1, structuredCount: 0, dimensionCount: 1, matches: [makeMatch()], remedyCandidates: [] },
      ],
    });
    expect(compileObservations(result)).toHaveLength(0);
  });

  it('derives polarity from effectDirection', () => {
    const result = makeResult({
      domains: [{
        domain: 'health', matchCount: 1, structuredCount: 1, dimensionCount: 0,
        matches: [makeMatch({ effectDirection: 'decrease', ruleId: 'r2' })], remedyCandidates: [],
      }],
    });
    expect(compileObservations(result)[0]!.polarity).toBe('negative');
  });

  it('tags a match as mahadasha/antardasha tier when the timeline says it is the current period', () => {
    const timeline: TimelineEvent[] = [{
      type: 'mahadasha', lord: 'Jupiter', startMs: 0, endMs: 1, isCurrent: true, isPast: false,
      relevantRuleIds: ['BPHS_CH1_V1_R001'], domains: ['career'],
    }];
    const result = makeResult({
      domains: [{ domain: 'career', matchCount: 1, structuredCount: 1, dimensionCount: 0, matches: [makeMatch()], remedyCandidates: [] }],
      timeline,
    });
    expect(compileObservations(result)[0]!.strengthTier).toBe('mahadasha');
  });
});

describe('compileObservations — yogas', () => {
  const yoga: DetectedYoga = {
    name: 'Gajakesari Yoga', strength: 'exact', planets: ['Jupiter', 'Moon'], houses: [1],
    formationNote: 'Jupiter in kendra from Moon', kgRuleIds: [],
  };

  it('marks a classically auspicious yoga as positive, minor-yoga tier', () => {
    const observations = compileObservations(makeResult({ yogas: [yoga] }));
    expect(observations).toHaveLength(1);
    expect(observations[0]!.domain).toBe('Overall Life Direction');
    expect(observations[0]!.polarity).toBe('positive');
    expect(observations[0]!.strengthTier).toBe('minor-yoga');
    expect(observations[0]!.sourceKind).toBe('computed-yoga');
  });

  it('marks Kemadruma Yoga as negative', () => {
    const kemadruma: DetectedYoga = { ...yoga, name: 'Kemadruma Yoga' };
    const observations = compileObservations(makeResult({ yogas: [kemadruma] }));
    expect(observations[0]!.polarity).toBe('negative');
  });
});

describe('compileObservations — doshas', () => {
  it('routes Mangal Dosha to the Marriage domain and marks it negative when not cancelled', () => {
    const dosha: DetectedDosha = {
      name: 'Mangal Dosha', severity: 'medium', planets: ['Mars'], houses: [8],
      formationNote: 'Mars in house 8', cancellationReasons: [], kgRuleIds: [],
    };
    const observations = compileObservations(makeResult({ doshas: [dosha] }));
    expect(observations[0]!.domain).toBe('Marriage');
    expect(observations[0]!.polarity).toBe('negative');
  });

  it('marks a cancelled dosha as neutral, not negative', () => {
    const dosha: DetectedDosha = {
      name: 'Mangal Dosha', severity: 'cancelled', planets: ['Mars'], houses: [8],
      formationNote: 'Mars exalted', cancellationReasons: ['Mars is exalted'], kgRuleIds: [],
    };
    const observations = compileObservations(makeResult({ doshas: [dosha] }));
    expect(observations[0]!.polarity).toBe('neutral');
  });

  it('falls back an unmapped dosha to Overall Life Direction', () => {
    const dosha: DetectedDosha = {
      name: 'Kaal Sarp Dosha — Anant', severity: 'medium', planets: ['Rahu', 'Ketu'], houses: [1, 7],
      formationNote: 'All grahas hemmed', cancellationReasons: [], kgRuleIds: [],
    };
    const observations = compileObservations(makeResult({ doshas: [dosha] }));
    expect(observations[0]!.domain).toBe('Overall Life Direction');
  });
});

describe('compileObservations — transit', () => {
  it('maps a transit match to a domain via its categories, falling back to Overall Life Direction', () => {
    const result = makeResult({
      transit: { positions: [], matches: [makeMatch({ ruleId: 't1', categories: ['finance'] })] },
    });
    const observations = compileObservations(result);
    expect(observations[0]!.domain).toBe('Money');
    expect(observations[0]!.strengthTier).toBe('transit');
  });

  it('returns no transit observations when transit is null', () => {
    const observations = compileObservations(makeResult({ transit: null }));
    expect(observations).toHaveLength(0);
  });
});
