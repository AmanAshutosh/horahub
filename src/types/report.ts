/**
 * Report rendering contracts.
 *
 * These types define what every report section can receive from the Inference
 * Engine. When `status === 'pending'` (or when the section is absent entirely)
 * the component renders "Pending Knowledge Engine" instead of content.
 *
 * No text is ever fabricated: a section must have real evidence[] or it must
 * show the pending placeholder. The layout and components are ready; the data
 * is not yet.
 */

export type ReportSectionStatus = 'populated' | 'partial' | 'pending';

/** One KB-sourced rule that supports a claim in this section. */
export interface ReportEvidence {
  ruleId: string;
  book: string;
  chapter: string | null;
  verse: string | null;
  /** Verbatim extracted rule text — never paraphrased or summarised. */
  text: string;
  categories: string[];
  extractionConfidence: number;
  validationConfidence: number | null;
}

/** A primary-source citation shown alongside section items. */
export interface ReportCitation {
  work: string;    // "BPHS", "Phaladeepika", etc.
  ref: string;     // "Ch.24, v.12"
  tradition?: string;
  /** Verbatim source fragment — never rewritten. */
  text: string;
}

export interface ReportTableRow {
  cells: (string | number | null)[];
  highlight?: boolean;
  variant?: 'positive' | 'negative' | 'warning' | 'neutral';
}

export interface ReportTable {
  caption?: string;
  columns: string[];
  rows: ReportTableRow[];
}

/** Structured "why" behind a remedy card — direct copy of a matched rule's
 *  condition fields, never fabricated. Omitted fields mean the source rule
 *  simply didn't provide that detail. */
export interface ReportRemedyCause {
  planet: string | null;
  house: number | null;
  sign: string | null;
  dignity: string | null;
  conditionRaw: string | null;
}

/** One cited classical remedy prescription within a ReportRemedyCard. */
export interface ReportRemedyField {
  type: 'gemstone' | 'mantra' | 'donation' | 'fasting' | 'worship' | 'lifestyle';
  raw: string;
  ruleId: string;
  book: string;
  bookCode: string;
  chapter: string | null;
  verse: string | null;
  extractionConfidence: number;
}

/** One "problem card" for a life-area section: responsible planet, chart-derived
 *  cause (when available), classical explanation, and every distinct remedy
 *  type matched rules prescribe for that planet — each independently cited. */
export interface ReportRemedyCard {
  id: string;
  domain: string;
  responsiblePlanet: string | null;
  cause: ReportRemedyCause | null;
  classicalExplanation: string;
  confidenceTier: 'structured' | 'planet-only' | 'lifestyle';
  fields: ReportRemedyField[];
  citations: ReportCitation[];
}

/** A single claim inside a section — backed by evidence, never invented. */
export interface ReportItem {
  title: string;
  body: string;
  direction?: 'positive' | 'negative' | 'neutral';
  citations?: ReportCitation[];
  evidence?: ReportEvidence[];
  tags?: string[];
}

export interface ReportSectionData {
  id: string;
  title: string;
  subtitle?: string;
  /** Short intro — must come from evidence, never fabricated. */
  summary?: string;
  status: ReportSectionStatus;
  items?: ReportItem[];
  tables?: ReportTable[];
  citations?: ReportCitation[];
  evidence?: ReportEvidence[];
  note?: string;

  /**
   * Cause-linked remedy recommendations for this life area — populated only
   * when at least one matched rule in this domain prescribes a remedy
   * connected to a planet. Omitted (undefined) when none qualify — never a
   * placeholder.
   */
  remedyCards?: ReportRemedyCard[];

  /**
   * Chart-specific factual context paragraph — states which houses/planets/signs
   * are relevant to this domain in this person's chart. Derived from ChartFacts
   * and KB signification tables. Never astrologically fabricated.
   */
  chartContext?: string;

  /**
   * Positive-direction items filtered from items[] by the LifeDomainInterpreter.
   * Each body is a verbatim classical text that supports a favourable pattern.
   */
  strengths?: ReportItem[];

  /**
   * Negative-direction items filtered from items[] by the LifeDomainInterpreter.
   * Each body is a verbatim classical text that flags a point of attention.
   */
  challenges?: ReportItem[];

  /**
   * Practical direction statements derived from KB planet/house themes.
   * References chart positions and classical significations — no invented claims.
   */
  advice?: string[];
}

/** Person info stored alongside the chart result so the report cover can render it. */
export interface PersonInfo {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  /** YYYY-MM-DD (local date as entered) */
  birthDate: string;
  /** HH:mm (local time as entered) */
  birthTime: string;
  placeName: string;
}
