/**
 * Observation compiler (Phase B1) — pure projection, not a new inference
 * engine.
 *
 * Walks an already-computed InferenceResult (rule matches, yogas, doshas,
 * transit matches — all already deterministically scored by src/inference/*)
 * and re-labels each into a short, structured Observation. No new matching,
 * scoring, or conflict resolution happens here — that's already done
 * upstream. No prose is generated here either — `claim` is a short
 * deterministic template label for the LLM to work from later (Phase C),
 * not user-facing report text.
 *
 * NEXT STEP (not yet built): src/narrative/merge.ts (B2) will group these
 * Observations by domain, prioritize by strengthTier, and combine
 * conflicting polarities into a single nuanced MergedObservation.
 */
import type { InferenceResult, MatchedRule, DetectedYoga, DetectedDosha, TimelineEvent } from '@/inference/types';
import type { Observation, Polarity, StrengthTier } from './types';
import { KB_CATEGORY_TO_DOMAIN, type LifeDomain } from './domain-map';

function polarityOf(m: MatchedRule): Polarity {
  if (m.effectDirection === 'increase') return 'positive';
  if (m.effectDirection === 'decrease') return 'negative';
  return 'neutral';
}

function claimOf(domain: string, m: MatchedRule): string {
  const focus = m.effectDomain ?? domain;
  if (m.effectDirection === 'increase') return `Supportive influence on ${focus}`;
  if (m.effectDirection === 'decrease') return `Challenging influence on ${focus}`;
  return `Notable influence on ${focus}`;
}

/**
 * Rule IDs tied to the CURRENTLY running mahadasha/antardasha, read from the
 * timeline's current-period events (src/inference/timeline.ts already did
 * the lord-name association work — this just looks it up).
 */
function currentDashaRuleTiers(timeline: TimelineEvent[]): Map<string, 'mahadasha' | 'antardasha'> {
  const map = new Map<string, 'mahadasha' | 'antardasha'>();
  for (const event of timeline) {
    if (!event.isCurrent) continue;
    for (const ruleId of event.relevantRuleIds) map.set(ruleId, event.type);
  }
  return map;
}

function domainObservations(
  result: InferenceResult,
  dashaTiers: Map<string, 'mahadasha' | 'antardasha'>,
): Observation[] {
  const observations: Observation[] = [];
  for (const domainResult of result.domains) {
    if (domainResult.domain === 'yogas') continue; // yogas are handled separately below
    const domain = KB_CATEGORY_TO_DOMAIN[domainResult.domain];
    if (!domain) continue; // no narrative-layer domain mapping for this KB category (see domain-map.ts)

    for (const match of domainResult.matches) {
      const strengthTier: StrengthTier = dashaTiers.get(match.ruleId) ?? 'natal';
      observations.push({
        id: `obs:${match.ruleId}`,
        domain,
        claim: claimOf(domain, match),
        sourceText: match.sourceText,
        polarity: polarityOf(match),
        strengthTier,
        confidence: match.confidence,
        sourceRuleIds: [match.ruleId],
        sourceKind: 'kb-rule',
      });
    }
  }
  return observations;
}

/** Yogas classically described as inauspicious — everything else in yoga-detector.ts is auspicious. */
const NEGATIVE_YOGA_NAMES = new Set(['Kemadruma Yoga']);

function yogaObservations(yogas: DetectedYoga[]): Observation[] {
  return yogas.map((yoga, i) => {
    const negative = NEGATIVE_YOGA_NAMES.has(yoga.name);
    return {
      id: `obs:yoga:${i}:${yoga.name}`,
      domain: 'Overall Life Direction' satisfies LifeDomain,
      claim: negative
        ? `${yoga.name} present — a classically inauspicious combination`
        : `${yoga.name} present — a classically auspicious combination`,
      sourceText: yoga.formationNote,
      polarity: (negative ? 'negative' : 'positive') as Polarity,
      strengthTier: 'minor-yoga' as StrengthTier,
      confidence: yoga.strength === 'exact' ? 0.9 : yoga.strength === 'approximate' ? 0.6 : 0.4,
      sourceRuleIds: yoga.kgRuleIds,
      sourceKind: 'computed-yoga' as const,
    };
  });
}

/** Dosha-name prefix -> domain where classical texts most directly discuss its effect. Falls back to Overall Life Direction. */
const DOSHA_DOMAIN_PREFIX: ReadonlyArray<readonly [string, LifeDomain]> = [
  ['Mangal Dosha', 'Marriage'],
];

function doshaDomainFor(name: string): LifeDomain {
  return DOSHA_DOMAIN_PREFIX.find(([prefix]) => name.startsWith(prefix))?.[1] ?? 'Overall Life Direction';
}

function doshaObservations(doshas: DetectedDosha[]): Observation[] {
  return doshas.map((dosha, i) => {
    const isCancelled = dosha.severity === 'cancelled';
    return {
      id: `obs:dosha:${i}:${dosha.name}`,
      domain: doshaDomainFor(dosha.name),
      claim: isCancelled
        ? `${dosha.name} present but classically cancelled`
        : `${dosha.name} present (${dosha.severity} severity)`,
      sourceText: dosha.formationNote,
      polarity: (isCancelled ? 'neutral' : 'negative') as Polarity,
      strengthTier: 'natal' as StrengthTier,
      confidence: dosha.severity === 'high' ? 0.8 : dosha.severity === 'medium' ? 0.6 : 0.4,
      sourceRuleIds: dosha.kgRuleIds,
      sourceKind: 'computed-dosha' as const,
    };
  });
}

function transitObservations(result: InferenceResult): Observation[] {
  if (!result.transit) return [];
  return result.transit.matches.map((match) => {
    const domain = match.categories.map((c) => KB_CATEGORY_TO_DOMAIN[c]).find((d): d is LifeDomain => !!d)
      ?? ('Overall Life Direction' satisfies LifeDomain);
    return {
      id: `obs:transit:${match.ruleId}`,
      domain,
      claim: claimOf(domain, match),
      sourceText: match.sourceText,
      polarity: polarityOf(match),
      strengthTier: 'transit' as StrengthTier,
      confidence: match.confidence,
      sourceRuleIds: [match.ruleId],
      sourceKind: 'kb-rule' as const,
    };
  });
}

/**
 * Project a deterministic InferenceResult into structured Observation[].
 * Pure function — no I/O, no randomness, same input always produces the
 * same output.
 */
export function compileObservations(result: InferenceResult): Observation[] {
  const dashaTiers = currentDashaRuleTiers(result.timeline);
  return [
    ...domainObservations(result, dashaTiers),
    ...yogaObservations(result.yogas),
    ...doshaObservations(result.doshas),
    ...transitObservations(result),
  ];
}
