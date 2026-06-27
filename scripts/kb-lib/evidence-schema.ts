/**
 * Foundation only — these types are NOT wired to anything yet. No
 * Prediction or Evidence object is constructed anywhere in this codebase.
 * They exist so that when the (future, separately-approved) Interpretation
 * Engine is built, "no prediction without evidence" is structurally
 * enforced by the type system from day one, rather than retrofitted.
 *
 * Chain: Prediction → Evidence[] → Rule IDs → Books → Verses → Planets →
 * Dasha → Confidence. Every Prediction must resolve to one or more Evidence
 * entries; every Evidence entry must resolve to a real Rule ID present in
 * kb/rules/index/by-id.json — never a synthesized or implied source.
 */
import type { RuleCondition } from './rule-schema';

export interface EvidenceSource {
  ruleId: string; // must exist in kb/rules/index/by-id.json
  book: string;
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  page: number;
}

/** Which chart facts (from ChartFacts, the existing ephemeris layer — never recomputed here) satisfied this piece of evidence. */
export interface EvidenceChartMatch {
  planets: string[];
  houses: number[];
  signs: string[];
  dashaLord: string | null;
  antardashaLord: string | null;
  matchedConditions: RuleCondition[];
}

/** The four confidences carried through from the Rule, never collapsed into one number. */
export interface EvidenceConfidence {
  ocrConfidence: number | null;
  extractionConfidence: number;
  validationConfidence: number | null;
  inferenceWeight: number | null;
}

export interface Evidence {
  source: EvidenceSource;
  chartMatch: EvidenceChartMatch;
  confidence: EvidenceConfidence;
}

/**
 * A Prediction is forbidden from existing without at least one Evidence
 * entry — this interface has no constructor and no default-evidence
 * fallback. `conflicting` surfaces other Evidence that disagrees with this
 * prediction's domain/direction (see kb-conflicts.ts) so a future renderer
 * can show both sides instead of silently picking one.
 */
export interface Prediction {
  domain: string;
  statement: string;
  evidence: Evidence[]; // must be non-empty
  conflicting: Evidence[];
}
