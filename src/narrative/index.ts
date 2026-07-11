/**
 * Narrative Engine entry point.
 *
 * STATUS: Phase B1 only. compileObservations(InferenceResult) is the sole
 * exported capability right now — it does NOT call runInference() itself
 * and does NOT produce a ReportBrief. See NARRATIVE_ENGINE_HANDOFF.md at
 * the repo root for what's built vs. what's next.
 */
export type { Observation, Polarity, StrengthTier, ObservationSourceKind } from './types';
export { LIFE_DOMAINS, KB_CATEGORY_TO_DOMAIN, type LifeDomain } from './domain-map';
export { compileObservations } from './observation-compiler';
