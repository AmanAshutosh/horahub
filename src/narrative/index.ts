/**
 * Narrative Engine entry point.
 *
 * buildReportBrief(facts) is the main entry point: runs the deterministic KB
 * inference engine, compiles/merges its output, and returns a ReportBrief —
 * the structured (non-prose) input the LLM report-writing layer (Phase C,
 * src/llm/*) consumes.
 */
export type { Observation, Polarity, StrengthTier, ObservationSourceKind } from './types';
export { LIFE_DOMAINS, KB_CATEGORY_TO_DOMAIN, DOMAIN_TO_KB_CATEGORY, type LifeDomain } from './domain-map';
export { compileObservations } from './observation-compiler';
export { mergeObservations, groupMergedByDomain, STRENGTH_ORDER, type MergedObservation } from './merge';
export {
  buildReportBrief,
  BRIEF_VERSION,
  type ReportBrief,
  type LifeDomainBrief,
  type MahadashaBrief,
  type AntardashaBrief,
  type DashaPeriodBrief,
  type RiskLevel,
} from './report-brief';
