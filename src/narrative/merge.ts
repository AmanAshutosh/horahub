/**
 * Merge / prioritization layer (Phase B2).
 *
 * Groups Observation[] by topic (see Observation.topicKey), then within each
 * topic group applies the fixed strength order:
 *
 *   Natal Chart > Mahadasha > Antardasha > Transit > Minor Yogas
 *
 * The highest-priority, highest-confidence observation in a topic group
 * becomes the primary claim. Lower-priority observations in the same group
 * are never discarded (mirrors src/inference/conflict-resolver.ts's own
 * "never silently discard evidence" design, one layer up: there it's book
 * priority, here it's strengthTier):
 *   - if they CONTRADICT the primary (opposite polarity) they're kept as
 *     `nuance` — the eventual LLM prose should read as one coherent,
 *     qualified claim ("X is supported, but Y complicates it near-term"),
 *     never as two flatly contradictory sentences.
 *   - if they AGREE with (or are neutral relative to) the primary, they're
 *     kept as `corroboration` — additional supporting evidence, not a
 *     conflict.
 */
import type { Observation, Polarity, StrengthTier } from './types';

export const STRENGTH_ORDER: Record<StrengthTier, number> = {
  natal: 0,
  mahadasha: 1,
  antardasha: 2,
  transit: 3,
  'minor-yoga': 4,
};

export interface MergedObservation {
  domain: string;
  topicKey: string;
  primaryClaim: string;
  polarity: Polarity;
  strengthTier: StrengthTier;
  confidence: number;
  /** Same-topic claims that contradict the primary (opposite polarity), from a lower-priority tier. Retained, never discarded. */
  nuance: string[];
  /** Same-topic claims that agree with or are neutral relative to the primary — additional corroborating evidence. */
  corroboration: string[];
  supportingObservationIds: string[];
  contributingRuleIds: string[];
}

function isOpposite(a: Polarity, b: Polarity): boolean {
  return (a === 'positive' && b === 'negative') || (a === 'negative' && b === 'positive');
}

/**
 * Merge and prioritize Observation[] into MergedObservation[], one per
 * distinct topic. Pure function — no I/O, deterministic ordering (ties in
 * strengthTier+confidence are broken by the input array's own order, so
 * feed it a stable-ordered Observation[] for reproducible output).
 */
export function mergeObservations(observations: Observation[]): MergedObservation[] {
  const byTopic = new Map<string, Observation[]>();
  for (const obs of observations) {
    const group = byTopic.get(obs.topicKey);
    if (group) group.push(obs);
    else byTopic.set(obs.topicKey, [obs]);
  }

  const merged: MergedObservation[] = [];
  for (const [topicKey, group] of byTopic) {
    const sorted = [...group].sort((a, b) => {
      const tierDiff = STRENGTH_ORDER[a.strengthTier] - STRENGTH_ORDER[b.strengthTier];
      if (tierDiff !== 0) return tierDiff;
      return b.confidence - a.confidence;
    });
    const primary = sorted[0]!;

    const nuance: string[] = [];
    const corroboration: string[] = [];
    for (const obs of sorted.slice(1)) {
      (isOpposite(primary.polarity, obs.polarity) ? nuance : corroboration).push(obs.claim);
    }

    merged.push({
      domain: primary.domain,
      topicKey,
      primaryClaim: primary.claim,
      polarity: primary.polarity,
      strengthTier: primary.strengthTier,
      confidence: primary.confidence,
      nuance,
      corroboration,
      supportingObservationIds: sorted.map((o) => o.id),
      contributingRuleIds: [...new Set(sorted.flatMap((o) => o.sourceRuleIds))],
    });
  }
  return merged;
}

/** Group already-merged observations by domain — a convenience for report-brief.ts (B3). */
export function groupMergedByDomain(merged: MergedObservation[]): Map<string, MergedObservation[]> {
  const byDomain = new Map<string, MergedObservation[]>();
  for (const m of merged) {
    const group = byDomain.get(m.domain);
    if (group) group.push(m);
    else byDomain.set(m.domain, [m]);
  }
  return byDomain;
}
