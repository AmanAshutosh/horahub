/**
 * The structured Rule record produced by Stage 4 (encode). Every field here
 * exists to satisfy a specific traceability requirement. Rules are emitted
 * in 'draft' status; nothing is auto-validated, auto-merged, or
 * auto-deduplicated, and no numeric outcome weight is ever invented — there
 * is no probability information in classical prose to extract, so
 * `inferenceWeight` stays null until a human (or a later, explicitly
 * approved process) assigns one.
 */

export type RuleStatus = 'draft' | 'validated' | 'deprecated';

export type ConditionType =
  | 'planet-in-house'
  | 'planet-in-sign'
  | 'planet-conjunction'
  | 'planet-dignity'
  | 'planet-aspect'
  | 'house-lord-strength'
  | 'dasha-period'
  | 'nakshatra-placement'
  | 'yoga-presence'
  | 'unstructured';

export interface RuleCondition {
  /** Best-effort structural classification of the matched fragment — not a guarantee the fragment is a complete rule. */
  type: ConditionType;
  planet?: string;
  house?: number;
  sign?: string;
  /** e.g. 'exalted' | 'debilitated' | 'own' for planet-dignity. */
  dignity?: string;
  /** For planet-aspect: the OTHER planet doing the aspecting, when the text names it. Undefined (not 'any') when the text only says "aspected" without naming a source — that case is too generic to be conflict-comparable. */
  aspectingPlanet?: string;
  /** For dasha-period: the antardasha lord, only when the text uses the explicit "Planet-Planet" mahadasha-antardasha shorthand. */
  antardashaPlanet?: string;
  /** For nakshatra-placement. */
  nakshatra?: string;
  /** For yoga-presence: the named yoga, e.g. "Gajakesari Yoga". */
  yoga?: string;
  /** True when `planet` is actually a secondary point (Gulika, Mandi, etc.) rather than one of the 9 navagraha — see kb-lib/patterns/slots.ts SECONDARY_POINTS. */
  isSecondaryPoint?: boolean;
  /** The exact text fragment this condition was parsed from, for traceability. */
  raw: string;
}

/**
 * The "THEN" side of a rule. Deliberately qualitative, not numeric: classical
 * prose states an effect, not a probability. `direction` is only set when the
 * text itself uses an unambiguous polarity word (e.g. "auspicious", "loss",
 * "gain") — otherwise 'unspecified'. No magnitude is ever fabricated.
 */
export interface RuleEffect {
  domain: string | null; // one of the category tags this effect concerns, if inferable
  direction: 'increase' | 'decrease' | 'neutral' | 'unspecified';
  text: string;
}

export interface StructuredRule {
  conditions: RuleCondition[];
  effect: RuleEffect;
}

/** Only populated when the text explicitly states an age or numbered year — never inferred from category alone. */
export interface RuleTiming {
  ageYears: number | null;
  raw: string;
}

/** Only populated when the text explicitly prescribes a remedy action — never inferred from category alone. */
export interface RuleRemedy {
  type: 'gemstone' | 'mantra' | 'donation' | 'fasting';
  raw: string;
}

/**
 * Entity values extracted from the rule's text, used purely to build the
 * Stage 5 inverted indexes (kb-index.ts) so lookups don't have to scan every
 * rule. Presence in this object is not a correctness claim about the rule —
 * it is "this text mentions X", nothing more.
 */
export interface RuleDimensions {
  planets: string[];
  secondaryPoints: string[]; // Gulika, Mandi, etc. — kept separate from `planets` (navagraha only)
  houses: number[];
  signs: string[];
  nakshatras: string[];
  yogas: string[]; // named yogas, e.g. "Gajakesari Yoga" — free-text capture, not a controlled vocabulary
  dashaPlanets: string[];
  divisionalCharts: string[];
  remedyTypes: string[]; // e.g. "gemstone" | "mantra" | "donation" | "fasting"
}

export interface Rule {
  /** Permanent — never changes once assigned. Format: <BOOKCODE>_CH<chapter|UNK>_V<verse|UNK>_R<seq>. */
  id: string;
  version: number;
  status: RuleStatus;

  book: string; // slug
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  page: number;

  /** 1 (highest confidence/authority) .. 5 (lowest). See kb-encode.ts for the scoring formula. */
  priority: number;
  categories: string[];
  dimensions: RuleDimensions;

  /** Best-effort parse of condition → effect. Null when no confident structural parse was possible. */
  structuredRule: StructuredRule | null;
  /** IDs of every Pattern Registry entry (kb-lib/patterns/registry.ts) that fired on this rule's text — the traceability link from a structured condition back to the named parsing rule that produced it. */
  patternIds: string[];
  /** True only when conditions[] has 2+ entries — i.e. this rule's own text already expresses a multi-condition combination. Composition ACROSS rules is expressed via requiresRuleIds, not this flag. */
  isComposite: boolean;
  /** Null unless the text explicitly states a timing/age. */
  timing: RuleTiming | null;
  /** Null unless the text explicitly prescribes a remedy. */
  remedy: RuleRemedy | null;

  /** OCR'd text immediately preceding this unit that looks like un-translated source script, if any. Low reliability: Tesseract ran with the English model only, so this is NOT a real Sanskrit/Devanagari transcription — it is a placeholder for a future dedicated Sanskrit-OCR pass. */
  originalVerse: string | null;
  originalVerseReliable: false;

  /** The verbatim extracted English sentence this rule was built from. */
  translation: string;

  /** Reserved — distinguishing verse-translation from editorial commentary needs more than line-level heuristics. Always null today. */
  commentary: string | null;

  relatedRuleIds: string[];
  /** Other rule IDs this rule's applicability depends on (e.g. "5th lord strong" pointing at the rule that establishes that). Never auto-populated today — set by a human or a future, explicitly approved linking pass. */
  requiresRuleIds: string[];

  /** Four distinct confidences, deliberately never combined into one score. */
  ocrConfidence: number | null; // Tesseract's own mean word confidence for the source page
  extractionConfidence: number; // page-level trust in the OCR/digital text itself
  validationConfidence: number | null; // null until a human reviews this rule (Rule Validation phase)
  inferenceWeight: number | null; // null until explicitly assigned — never derived from text

  sourceSentenceId: string;
  createdAt: string;
}
