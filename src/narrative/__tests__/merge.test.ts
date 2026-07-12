import { describe, it, expect } from 'vitest';
import { mergeObservations, groupMergedByDomain } from '../merge';
import type { Observation } from '../types';

function obs(overrides: Partial<Observation>): Observation {
  return {
    id: 'obs:1',
    domain: 'Career',
    topicKey: 'Career::promotion',
    claim: 'Supportive influence on career',
    sourceText: 'source text',
    polarity: 'positive',
    strengthTier: 'natal',
    confidence: 0.7,
    sourceRuleIds: ['r1'],
    sourceKind: 'kb-rule',
    ...overrides,
  };
}

describe('mergeObservations', () => {
  it('produces one MergedObservation per distinct topicKey when there is no conflict', () => {
    const merged = mergeObservations([
      obs({ id: 'a', topicKey: 'Career::promotion' }),
      obs({ id: 'b', topicKey: 'Career::communication', claim: 'Supportive influence on communication' }),
    ]);
    expect(merged).toHaveLength(2);
  });

  it('picks the highest-strength-tier observation as primary within a topic', () => {
    const merged = mergeObservations([
      obs({ id: 'weak', strengthTier: 'transit', claim: 'transit claim' }),
      obs({ id: 'strong', strengthTier: 'natal', claim: 'natal claim' }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.primaryClaim).toBe('natal claim');
    expect(merged[0]!.strengthTier).toBe('natal');
  });

  it('breaks ties within the same strength tier by confidence', () => {
    const merged = mergeObservations([
      obs({ id: 'low', strengthTier: 'natal', confidence: 0.3, claim: 'low confidence' }),
      obs({ id: 'high', strengthTier: 'natal', confidence: 0.9, claim: 'high confidence' }),
    ]);
    expect(merged[0]!.primaryClaim).toBe('high confidence');
  });

  it('retains a contradicting lower-priority observation as nuance, not a separate top-level entry', () => {
    const merged = mergeObservations([
      obs({ id: 'natal-pos', strengthTier: 'natal', polarity: 'positive', claim: 'Career is strong' }),
      obs({ id: 'transit-neg', strengthTier: 'transit', polarity: 'negative', claim: 'Transit slows progress' }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.primaryClaim).toBe('Career is strong');
    expect(merged[0]!.nuance).toEqual(['Transit slows progress']);
    expect(merged[0]!.corroboration).toEqual([]);
  });

  it('files a same-topic, same-polarity observation as corroboration, not nuance', () => {
    const merged = mergeObservations([
      obs({ id: 'a', strengthTier: 'natal', polarity: 'positive', claim: 'primary claim' }),
      obs({ id: 'b', strengthTier: 'mahadasha', polarity: 'positive', claim: 'agreeing claim' }),
    ]);
    expect(merged[0]!.nuance).toEqual([]);
    expect(merged[0]!.corroboration).toEqual(['agreeing claim']);
  });

  it('never discards evidence — contributingRuleIds and supportingObservationIds cover the whole topic group', () => {
    const merged = mergeObservations([
      obs({ id: 'a', sourceRuleIds: ['r1'] }),
      obs({ id: 'b', strengthTier: 'transit', polarity: 'negative', sourceRuleIds: ['r2'] }),
    ]);
    expect(merged[0]!.supportingObservationIds.sort()).toEqual(['a', 'b']);
    expect(merged[0]!.contributingRuleIds.sort()).toEqual(['r1', 'r2']);
  });

  it('does not merge observations from different topics even in the same domain', () => {
    const merged = mergeObservations([
      obs({ id: 'a', topicKey: 'Career::rule:r1', polarity: 'positive' }),
      obs({ id: 'b', topicKey: 'Career::rule:r2', polarity: 'negative' }),
    ]);
    expect(merged).toHaveLength(2);
    expect(merged.every((m) => m.nuance.length === 0)).toBe(true);
  });
});

describe('groupMergedByDomain', () => {
  it('groups merged observations by their domain field', () => {
    const merged = mergeObservations([
      obs({ id: 'a', domain: 'Career', topicKey: 'Career::x' }),
      obs({ id: 'b', domain: 'Health', topicKey: 'Health::y' }),
    ]);
    const grouped = groupMergedByDomain(merged);
    expect(grouped.get('Career')).toHaveLength(1);
    expect(grouped.get('Health')).toHaveLength(1);
    expect(grouped.get('Marriage')).toBeUndefined();
  });
});
