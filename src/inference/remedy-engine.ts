/**
 * Remedy engine — extracts remedy prescriptions from matched rules.
 *
 * Only rules where rule.hasRemedy = true are included. Every remedy record
 * preserves the verbatim rule text, the book, chapter, and verse so it can
 * be cited and verified. Duration, start/end conditions, and expected purpose
 * are taken verbatim from the rule text — never inferred or guessed.
 */
import type { Rule, RuleCondition } from '../../scripts/kb-lib/rule-schema';
import type { MatchedRule, ExtractedRemedy, RemedyCard, RemedyCause, RemedyConfidenceTier, RemedyField } from './types';
import { getRuleIndex } from './loader';

/** Valid remedy type labels as stored in rule-schema. */
const REMEDY_TYPES = new Set(['gemstone', 'mantra', 'donation', 'fasting', 'worship', 'lifestyle']);

export function extractRemedies(allMatches: MatchedRule[]): ExtractedRemedy[] {
  const ruleIndex = getRuleIndex();
  const remedies: ExtractedRemedy[] = [];
  const seen = new Set<string>();

  for (const match of allMatches) {
    if (!match.hasRemedy) continue;
    if (seen.has(match.ruleId)) continue;
    seen.add(match.ruleId);

    // Load the full rule to get the remedy field
    const rule = ruleIndex.get(match.ruleId);
    if (!rule?.remedy) continue;

    const remedyType = rule.remedy.type;
    if (!REMEDY_TYPES.has(remedyType)) continue;

    remedies.push({
      type: remedyType as ExtractedRemedy['type'],
      raw: rule.remedy.raw,
      ruleId: match.ruleId,
      book: match.book,
      bookCode: match.bookCode,
      chapter: match.chapter,
      verse: match.verse,
      extractionConfidence: match.extractionConfidence,
    });
  }

  // Sort by book priority (BPHS first) then confidence
  const BOOK_ORDER = ['BPHS', 'HORA', 'PHALA', 'HAST', 'HJH1', 'HJH2', 'LOL'];
  remedies.sort((a, b) => {
    const ai = BOOK_ORDER.indexOf(a.bookCode);
    const bi = BOOK_ORDER.indexOf(b.bookCode);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return b.extractionConfidence - a.extractionConfidence;
  });

  return remedies;
}

// ── Cause-aware remedy cards (per life-area section) ────────────────────────

/** Minimum extraction confidence for a remedy field to appear on a card — keeps
 *  the new, more prominent card UI high-signal; the flat section above is
 *  unaffected and still shows every remedy regardless of this threshold. */
const MIN_CARD_FIELD_CONFIDENCE = 0.5;

const MAX_REMEDY_CARDS_PER_DOMAIN = 6;

/**
 * True for text carrying the signature of a specific OCR failure mode: a
 * multi-column reference table scanned as one flat text stream, which
 * produces a long run of disconnected "* label * label" bullet fragments
 * instead of coherent prose. extractionConfidence (character-recognition
 * quality) doesn't catch this — the individual characters are often read
 * correctly, only their order/structure is scrambled. Confirmed narrow: only
 * 4 of 886 rules in the one affected book match this pattern.
 */
function isCoherentText(text: string): boolean {
  return (text.match(/\*/g)?.length ?? 0) < 3;
}

/** First structured condition naming a planet or house — direct field copy, never fabricated. */
function deriveCause(rule: Rule): RemedyCause | null {
  const condition: RuleCondition | undefined = rule.structuredRule?.conditions.find(
    (c) => c.planet || c.house != null,
  );
  if (!condition) return null;
  return {
    planet: condition.planet ?? null,
    house: condition.house ?? null,
    sign: condition.sign ?? null,
    dignity: condition.dignity ?? null,
    conditionRaw: condition.raw,
  };
}

interface CardCandidate {
  rule: Rule;
  cause: RemedyCause | null;
  tier: RemedyConfidenceTier;
  planet: string | null;
}

/**
 * Build cause-linked remedy cards for one life-area domain, grouped by the
 * responsible planet. Every field traces to a real matched rule — a card is
 * only produced when at least one rule names a planet, and a field's
 * planet/house "cause" is only shown when the rule's own structured
 * condition actually provides it.
 */
export function buildDomainRemedyCards(domain: string, domainMatches: MatchedRule[]): RemedyCard[] {
  const ruleIndex = getRuleIndex();
  const candidates: CardCandidate[] = [];
  const seenRuleIds = new Set<string>();

  for (const match of domainMatches) {
    if (!match.hasRemedy) continue;
    if (seenRuleIds.has(match.ruleId)) continue;
    seenRuleIds.add(match.ruleId);

    const rule = ruleIndex.get(match.ruleId);
    if (!rule?.remedy) continue;
    if (!REMEDY_TYPES.has(rule.remedy.type)) continue;
    if (rule.extractionConfidence < MIN_CARD_FIELD_CONFIDENCE) continue;
    if (!isCoherentText(rule.translation)) continue;

    const fullCause = deriveCause(rule);
    let tier: RemedyConfidenceTier;
    let planet: string | null;
    if (rule.remedy.type === 'lifestyle') {
      const lifestylePlanet = fullCause?.planet ?? rule.dimensions.planets[0] ?? null;
      if (!lifestylePlanet) continue; // no planet named at all — not eligible for a card
      tier = 'lifestyle';
      planet = lifestylePlanet;
    } else if (fullCause?.planet && fullCause.house != null) {
      tier = 'structured';
      planet = fullCause.planet;
    } else if (rule.dimensions.planets.length > 0) {
      tier = 'planet-only';
      planet = rule.dimensions.planets[0]!;
    } else {
      continue; // no planet named at all — not eligible for a card (still shown in the flat section)
    }

    // Cause (the "Reason from chart" field) is only shown for the 'structured'
    // tier — a planet-only match has no verified house/condition to report,
    // and showing a bare planet name there would just repeat responsiblePlanet.
    const cause = tier === 'structured' ? fullCause : null;

    candidates.push({ rule, cause, tier, planet });
  }

  // Group by responsible planet (candidates with no planet at all were already excluded above).
  const byPlanet = new Map<string, CardCandidate[]>();
  for (const c of candidates) {
    const key = c.planet!;
    if (!byPlanet.has(key)) byPlanet.set(key, []);
    byPlanet.get(key)!.push(c);
  }

  const TIER_ORDER: Record<RemedyConfidenceTier, number> = { structured: 0, 'planet-only': 1, lifestyle: 2 };

  const scored: Array<{ card: RemedyCard; bestConfidence: number }> = [];
  for (const [planet, group] of byPlanet) {
    // Best cause/explanation: highest-confidence structured member, else highest-confidence overall.
    const sorted = [...group].sort((a, b) => b.rule.extractionConfidence - a.rule.extractionConfidence);
    const best = sorted.find((c) => c.tier === 'structured') ?? sorted[0]!;

    // One field per distinct remedy type, keeping the highest-confidence rule for each.
    const byType = new Map<string, CardCandidate>();
    for (const c of sorted) {
      const type = c.rule.remedy!.type;
      const existing = byType.get(type);
      if (!existing || c.rule.extractionConfidence > existing.rule.extractionConfidence) byType.set(type, c);
    }

    const fields: RemedyField[] = Array.from(byType.values()).map((c) => ({
      type: c.rule.remedy!.type,
      raw: c.rule.remedy!.raw,
      ruleId: c.rule.id,
      book: c.rule.book,
      bookCode: c.rule.bookCode,
      chapter: c.rule.chapter,
      verse: c.rule.verse,
      extractionConfidence: c.rule.extractionConfidence,
    }));

    scored.push({
      bestConfidence: best.rule.extractionConfidence,
      card: {
        id: `${domain}:${planet}`,
        domain,
        responsiblePlanet: planet,
        cause: best.cause,
        classicalExplanation: best.rule.translation,
        confidenceTier: best.tier,
        fields,
        citations: fields.map((f) => ({
          ruleId: f.ruleId, book: f.book, bookCode: f.bookCode, chapter: f.chapter, verse: f.verse,
        })),
      },
    });
  }

  scored.sort((a, b) => {
    if (TIER_ORDER[a.card.confidenceTier] !== TIER_ORDER[b.card.confidenceTier]) {
      return TIER_ORDER[a.card.confidenceTier] - TIER_ORDER[b.card.confidenceTier];
    }
    return b.bestConfidence - a.bestConfidence;
  });

  return scored.slice(0, MAX_REMEDY_CARDS_PER_DOMAIN).map((s) => s.card);
}
