/**
 * Confidence engine — deterministic 0..1 scoring.
 *
 * Never uses LLM probability. Every factor is derived directly from the rule's
 * own metadata or from the match type. The formula is stable and reproducible:
 * the same rule + same match context always produces the same score.
 *
 * Formula:
 *   base × source_factor × quality_factor × conflict_penalty
 *   + composite_bonus + corroboration_bonus
 *   clamped to [0, 1]
 */

export type BookCode = 'BPHS' | 'HORA' | 'PHALA' | 'LOL' | 'HAST' | 'HJH1' | 'HJH2' | string;

/** Input factors for confidence computation. */
export interface ConfidenceInput {
  /** 'structured' = all conditions passed; 'dimension' = entity-mention only */
  matchType: 'structured' | 'dimension';
  bookCode: BookCode;
  /** Rule priority 1 (highest) .. 5 (lowest). */
  priority: number;
  extractionConfidence: number;
  validationConfidence: number | null;
  conflictCount: number;
  corroborationCount: number;
  isComposite: boolean;
}

// ── Factor tables ─────────────────────────────────────────────────────────────

/** Base confidence by match type. */
const BASE: Record<'structured' | 'dimension', number> = {
  structured: 0.75,
  dimension: 0.35,
};

/** Book authority factor. BPHS is the canonical source. */
const SOURCE_FACTOR: Record<string, number> = {
  BPHS:  1.00,
  HORA:  0.90,
  PHALA: 0.85,
  HAST:  0.85, // user-flagged high priority for remedies — matches Phaladeepika's tier
  HJH1:  0.80,
  HJH2:  0.80,
  LOL:   0.75,
};

/** Priority discount (priority 1 = best; 5 = worst). */
function priorityFactor(priority: number): number {
  // priority 1 → 1.0, priority 2 → 0.93, priority 3 → 0.86, priority 4 → 0.79, priority 5 → 0.72
  return Math.max(0.7, 1.0 - (priority - 1) * 0.07);
}

/** Quality factor from extraction + validation confidence. */
function qualityFactor(extraction: number, validation: number | null): number {
  if (validation !== null) {
    return extraction * 0.4 + validation * 0.6;
  }
  return extraction * 0.7 + 0.3 * 0.5; // assume average for unreviewed rules
}

/** Conflict penalty: more conflicts → lower confidence. */
function conflictPenalty(conflictCount: number): number {
  if (conflictCount === 0) return 1.0;
  if (conflictCount === 1) return 0.85;
  if (conflictCount === 2) return 0.75;
  return 0.65;
}

/** Composite bonus: rule explicitly states multi-condition combination. */
const COMPOSITE_BONUS = 0.05;

/** Corroboration bonus per corroborating rule, capped. */
const CORROBORATION_BONUS_PER = 0.04;
const CORROBORATION_BONUS_CAP = 0.12;

// ── Main function ─────────────────────────────────────────────────────────────

/** Compute a deterministic confidence score in [0, 1]. */
export function computeConfidence(input: ConfidenceInput): number {
  const base = BASE[input.matchType];
  const source = SOURCE_FACTOR[input.bookCode] ?? 0.70;
  const priority = priorityFactor(input.priority);
  const quality = qualityFactor(input.extractionConfidence, input.validationConfidence);
  const conflict = conflictPenalty(input.conflictCount);

  let score = base * source * priority * quality * conflict;

  if (input.isComposite) score += COMPOSITE_BONUS;

  const corrobBonus = Math.min(
    input.corroborationCount * CORROBORATION_BONUS_PER,
    CORROBORATION_BONUS_CAP,
  );
  score += corrobBonus;

  return Math.min(1.0, Math.max(0.0, parseFloat(score.toFixed(4))));
}

/**
 * Book priority order for conflict resolution (lower index = higher authority).
 * When two rules conflict, the rule from the higher-authority book is preferred.
 * If same book, surface both (never silently discard evidence).
 */
export const BOOK_PRIORITY: readonly BookCode[] = ['BPHS', 'HORA', 'PHALA', 'HAST', 'HJH1', 'HJH2', 'LOL'];

export function bookPriorityOf(bookCode: BookCode): number {
  const idx = BOOK_PRIORITY.indexOf(bookCode);
  return idx === -1 ? BOOK_PRIORITY.length : idx;
}
