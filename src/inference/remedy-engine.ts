/**
 * Remedy engine — extracts remedy prescriptions from matched rules.
 *
 * Only rules where rule.hasRemedy = true are included. Every remedy record
 * preserves the verbatim rule text, the book, chapter, and verse so it can
 * be cited and verified. Duration, start/end conditions, and expected purpose
 * are taken verbatim from the rule text — never inferred or guessed.
 */
import type { MatchedRule, ExtractedRemedy } from './types';
import { getRuleIndex } from './loader';

/** Valid remedy type labels as stored in rule-schema. */
const REMEDY_TYPES = new Set(['gemstone', 'mantra', 'donation', 'fasting']);

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
  const BOOK_ORDER = ['BPHS', 'HORA', 'PHALA', 'LOL'];
  remedies.sort((a, b) => {
    const ai = BOOK_ORDER.indexOf(a.bookCode);
    const bi = BOOK_ORDER.indexOf(b.bookCode);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return b.extractionConfidence - a.extractionConfidence;
  });

  return remedies;
}
