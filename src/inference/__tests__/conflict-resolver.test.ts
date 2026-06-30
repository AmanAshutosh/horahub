/**
 * Unit tests for conflict-resolver.ts
 */
import { describe, it, expect } from 'vitest';
import { resolveConflicts, splitByResolution } from '../conflict-resolver';
import type { MatchedRule } from '../types';

function makeRule(overrides: Partial<MatchedRule>): MatchedRule {
  return {
    ruleId: 'TEST_R001',
    book: 'bphs-santhanam',
    bookCode: 'BPHS',
    chapter: '1',
    verse: '1',
    page: 1,
    priority: 1,
    categories: ['career'],
    sourceText: 'Test rule text.',
    matchType: 'structured',
    matchedConditionRaws: [],
    effectDirection: 'increase',
    effectDomain: 'career',
    confidence: 0.8,
    extractionConfidence: 0.8,
    validationConfidence: null,
    conflictingRuleIds: [],
    corroboratingRuleIds: [],
    hasRemedy: false,
    hasTiming: false,
    isComposite: false,
    ...overrides,
  };
}

describe('resolveConflicts', () => {
  it('marks rules with no conflicts as no_conflict', () => {
    const matches = [
      makeRule({ ruleId: 'R1' }),
      makeRule({ ruleId: 'R2' }),
    ];
    const resolved = resolveConflicts(matches);
    expect(resolved).toHaveLength(2);
    expect(resolved.every((r) => r.resolution === 'no_conflict')).toBe(true);
  });

  it('marks higher-authority book as primary in conflict', () => {
    const matches = [
      makeRule({ ruleId: 'R1', bookCode: 'BPHS', conflictingRuleIds: ['R2'] }),
      makeRule({ ruleId: 'R2', bookCode: 'LOL',  conflictingRuleIds: ['R1'] }),
    ];
    const resolved = resolveConflicts(matches);
    const r1 = resolved.find((r) => r.match.ruleId === 'R1')!;
    const r2 = resolved.find((r) => r.match.ruleId === 'R2')!;
    expect(r1.resolution).toBe('primary');
    expect(r2.resolution).toBe('secondary');
  });

  it('marks equal-authority conflicts as equal_conflict', () => {
    const matches = [
      makeRule({ ruleId: 'R1', bookCode: 'BPHS', conflictingRuleIds: ['R2'] }),
      makeRule({ ruleId: 'R2', bookCode: 'BPHS', conflictingRuleIds: ['R1'] }),
    ];
    const resolved = resolveConflicts(matches);
    expect(resolved.every((r) => r.resolution === 'equal_conflict')).toBe(true);
  });

  it('ignores conflict with rule not in the matched set', () => {
    const matches = [
      makeRule({ ruleId: 'R1', conflictingRuleIds: ['ABSENT_RULE'] }),
    ];
    const resolved = resolveConflicts(matches);
    expect(resolved[0]!.resolution).toBe('no_conflict');
  });
});

describe('splitByResolution', () => {
  it('separates primary, secondary, and equal conflicts', () => {
    const matches = [
      makeRule({ ruleId: 'R1', bookCode: 'BPHS', conflictingRuleIds: ['R2'] }),
      makeRule({ ruleId: 'R2', bookCode: 'LOL',  conflictingRuleIds: ['R1'] }),
      makeRule({ ruleId: 'R3' }),
    ];
    const resolved = resolveConflicts(matches);
    const { primary, secondary } = splitByResolution(resolved);
    expect(primary.some((m) => m.ruleId === 'R1')).toBe(true);
    expect(primary.some((m) => m.ruleId === 'R3')).toBe(true);
    expect(secondary.some((m) => m.ruleId === 'R2')).toBe(true);
  });
});
