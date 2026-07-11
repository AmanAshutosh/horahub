/**
 * Inference Engine — core types.
 *
 * All types in this file are plain data (no runtime behaviour). They define
 * the contracts between every stage of the inference pipeline.
 *
 * Nothing here is fabricated: every field that holds text must originate from
 * a rule's `translation` field (the verbatim extracted source sentence).
 */

import type { PlanetName } from '@/types/chart';

// ── Rule match ────────────────────────────────────────────────────────────────

/**
 * How the rule was matched against the chart:
 * - 'structured' = every structured condition in the rule passed exactly
 * - 'dimension'  = the rule mentions relevant entities (planet/house/sign)
 *                  but has no parsed conditions to verify
 */
export type MatchType = 'structured' | 'dimension';

/** A single rule from the KB that matched this chart, with full provenance. */
export interface MatchedRule {
  ruleId: string;
  book: string;
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  page: number;
  /** 1 (highest) .. 5 (lowest) — derived from book + OCR quality at encode time. */
  priority: number;
  categories: string[];
  /** Verbatim source sentence — never paraphrased, never summarised. */
  sourceText: string;
  matchType: MatchType;
  /** The conditions that passed when matchType = 'structured'. */
  matchedConditionRaws: string[];
  /** Effect direction from the structured rule, if available. */
  effectDirection: 'increase' | 'decrease' | 'neutral' | 'unspecified';
  /** Effect domain from the structured rule, if available. */
  effectDomain: string | null;
  /** Deterministic confidence: 0..1. */
  confidence: number;
  /** Raw extraction confidence from the KB encoder. */
  extractionConfidence: number;
  /** Human validation confidence, null until manually reviewed. */
  validationConfidence: number | null;
  /** Rule IDs from the same KB that contradict this rule. */
  conflictingRuleIds: string[];
  /** Rule IDs from different books that express the same condition. */
  corroboratingRuleIds: string[];
  hasRemedy: boolean;
  hasTiming: boolean;
  isComposite: boolean;
}

// ── Per-domain result ─────────────────────────────────────────────────────────

export interface DomainResult {
  /** One of: career | marriage | health | finance | remedies | yogas | past-validation | timeline */
  domain: string;
  /** Total rules that matched any criteria for this domain. */
  matchCount: number;
  /** Rules with at least one passing structured condition. */
  structuredCount: number;
  /** Rules matched by entity mention only. */
  dimensionCount: number;
  /** Top matches, sorted by confidence descending. */
  matches: MatchedRule[];
  /** Remedy-bearing matches from the full match pool, uncapped by the narrative
   *  top-N — used only for remedy-card generation so remedy content isn't
   *  crowded out by higher-confidence non-remedy matches. */
  remedyCandidates: MatchedRule[];
}

// ── Yoga detection ────────────────────────────────────────────────────────────

export type YogaStrength = 'exact' | 'approximate' | 'partial';

export interface DetectedYoga {
  /** Canonical yoga name (e.g. "Hamsa Yoga", "Gajakesari Yoga"). */
  name: string;
  strength: YogaStrength;
  /** Planets that form the yoga in this chart. */
  planets: string[];
  /** House(es) involved, if applicable. */
  houses: number[];
  /** One-line description of the formation condition (derived, not fabricated prose). */
  formationNote: string;
  /** Rules from the KB that reference this yoga by name, if any. */
  kgRuleIds: string[];
}

// ── Dosha detection ───────────────────────────────────────────────────────────

export type DoshaSeverity = 'high' | 'medium' | 'low' | 'cancelled';

export interface DetectedDosha {
  /** Canonical dosha name (e.g. "Mangal Dosha", "Kaal Sarp Dosha — Anant"). */
  name: string;
  severity: DoshaSeverity;
  /** Planets that form the dosha in this chart. */
  planets: string[];
  /** House(es) involved, if applicable. */
  houses: number[];
  /** One-line description of the formation condition (derived, not fabricated prose). */
  formationNote: string;
  /** Reasons the dosha is fully or partially cancelled — empty if not cancelled. */
  cancellationReasons: string[];
  /** Rules from the KB that reference this dosha by name, if any. */
  kgRuleIds: string[];
}

// ── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  type: 'mahadasha' | 'antardasha';
  lord: string;
  startMs: number;
  endMs: number;
  isCurrent: boolean;
  isPast: boolean;
  /** Matched rules specifically about this dasha lord. */
  relevantRuleIds: string[];
  /** Life area domains that those rules address. */
  domains: string[];
}

// ── Remedies ──────────────────────────────────────────────────────────────────

export interface ExtractedRemedy {
  type: 'gemstone' | 'mantra' | 'donation' | 'fasting' | 'worship' | 'lifestyle';
  /** Verbatim remedy text from the rule. */
  raw: string;
  ruleId: string;
  book: string;
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  extractionConfidence: number;
}

// ── Cause-aware remedy cards ──────────────────────────────────────────────────

/**
 * Structured "why" behind a remedy — planet/house/condition, when the source
 * rule's structuredRule provides it. Every field is a direct copy of a
 * RuleCondition field already present on the encoded rule; never fabricated.
 */
export interface RemedyCause {
  planet: string | null;
  house: number | null;
  sign: string | null;
  dignity: string | null;
  /** Verbatim condition text this cause was derived from. */
  conditionRaw: string | null;
}

/**
 * Confidence tier for a remedy card — purely structural, not a new score:
 * - 'structured'  = derived from a rule with a full planet+house condition
 * - 'planet-only' = rule mentions a planet but has no parsed condition
 * - 'lifestyle'   = remedy type is 'lifestyle' — always lowest tier,
 *                   regardless of cause quality, per the conservative-
 *                   extraction design.
 */
export type RemedyConfidenceTier = 'structured' | 'planet-only' | 'lifestyle';

/** One cited classical remedy prescription within a RemedyCard. */
export interface RemedyField {
  type: ExtractedRemedy['type'];
  raw: string;
  ruleId: string;
  book: string;
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  extractionConfidence: number;
}

/**
 * One "problem card" for a life-area section: a responsible planet, its
 * chart-derived cause (when available), the classical explanation, and every
 * distinct remedy type matched rules prescribe for that planet within this
 * domain. Fields are omitted — never fabricated — when no rule supports them.
 */
export interface RemedyCard {
  id: string;
  domain: string;
  responsiblePlanet: string | null;
  cause: RemedyCause | null;
  /** Verbatim source sentence providing the classical explanation. */
  classicalExplanation: string;
  confidenceTier: RemedyConfidenceTier;
  fields: RemedyField[];
  citations: Array<{ ruleId: string; book: string; bookCode: string; chapter: string | null; verse: string | null }>;
}

// ── Past validation ───────────────────────────────────────────────────────────

export interface PastObservation {
  /** e.g. "Jupiter Mahadasha (2010–2026)" */
  periodLabel: string;
  dashLord: string;
  startYear: number;
  endYear: number;
  isPast: boolean;
  /** Rules matched for this dasha lord. Source texts only — no interpretation. */
  ruleIds: string[];
  domains: string[];
}

// ── Transit ───────────────────────────────────────────────────────────────────

export interface TransitPlanetPosition {
  planet: PlanetName;
  sign: number; // 0..11
  siderealLon: number;
  /** Whole-sign house counted from the natal Lagna. */
  houseFromLagna: number; // 1..12
  /** Whole-sign house counted from the natal Moon. */
  houseFromMoon: number; // 1..12
}

// ── Full inference result ─────────────────────────────────────────────────────

export interface InferenceResult {
  computedAt: string;  // ISO timestamp
  /** Total rules evaluated across all KG queries. */
  totalRulesEvaluated: number;
  /** Rules that passed at least one matching criterion. */
  totalMatched: number;
  structuredMatched: number;
  dimensionMatched: number;
  /** Per-domain aggregation. */
  domains: DomainResult[];
  /** Yogas detected in this chart. */
  yogas: DetectedYoga[];
  /** Doshas (inauspicious combinations) detected in this chart. */
  doshas: DetectedDosha[];
  /** Dasha timeline events. */
  timeline: TimelineEvent[];
  /** Extracted remedy rules. */
  remedies: ExtractedRemedy[];
  /** Past and present dasha observations. */
  pastObservations: PastObservation[];
  /** Current transit positions + matched rules, or null if computation failed. */
  transit: { positions: TransitPlanetPosition[]; matches: MatchedRule[] } | null;
}
