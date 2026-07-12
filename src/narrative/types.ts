/**
 * Narrative Engine — core types (Phase B).
 *
 * This layer sits between the deterministic KB inference engine
 * (src/inference/*) and the LLM report-writing layer (planned: src/llm/*,
 * not yet built). Nothing here is prose — every field is either copied
 * verbatim from a MatchedRule/DetectedYoga/DetectedDosha, or a short
 * deterministically-templated label. Free-form narrative text is Phase C's
 * job, not this one.
 *
 * STATUS: Observation (B1), MergedObservation + mergeObservations (B2), and
 * ReportBrief (B3) are implemented. See NARRATIVE_ENGINE_HANDOFF.md at the
 * repo root for the phase history.
 */

export type StrengthTier = 'natal' | 'mahadasha' | 'antardasha' | 'transit' | 'minor-yoga';

export type Polarity = 'positive' | 'negative' | 'neutral';

export type ObservationSourceKind = 'kb-rule' | 'computed-yoga' | 'computed-dosha';

/**
 * One structured, non-prose claim derived from a single piece of already-
 * scored inference output (a MatchedRule, DetectedYoga, or DetectedDosha).
 */
export interface Observation {
  id: string;
  /** A narrative-layer life-domain label (see domain-map.ts), not a raw KB category string. */
  domain: string;
  /**
   * Clustering key for merge.ts's "same topic" grouping. Derived from the
   * source's own effectDomain when available (e.g. a rule-schema effectDomain
   * string), otherwise falls back to a value unique to this one observation
   * (so it never gets grouped with anything else) — a conservative default
   * that avoids false-merging unrelated claims just because they share a
   * life domain.
   */
  topicKey: string;
  /** Short, deterministically-templated label — NOT final report prose. */
  claim: string;
  /** Verbatim source text this observation is grounded in (rule sourceText / formationNote). Never fabricated. */
  sourceText: string;
  polarity: Polarity;
  strengthTier: StrengthTier;
  /** Carried through from the source's own deterministic confidence score. */
  confidence: number;
  sourceRuleIds: string[];
  sourceKind: ObservationSourceKind;
}
