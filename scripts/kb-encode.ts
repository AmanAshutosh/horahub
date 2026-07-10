/**
 * Stage 4 of the KB pipeline (see docs/KB_PIPELINE.md): encode.
 *
 * Reads kb/extracted/<book>/sentences.jsonl (segmented, chapter/verse-tagged
 * English text) and emits ONE draft Rule per candidate sentence into
 * kb/rules/<book>/rules.jsonl. Per explicit instruction:
 *   - every rule gets a PERMANENT id, never reused or reassigned
 *   - nothing is merged or deduplicated across — or even within — books
 *   - nothing is auto-validated; every rule starts status: 'draft'
 *   - relatedRuleIds / requiresRuleIds are left empty (future phases)
 *   - validationConfidence and inferenceWeight are left null
 *
 * Condition extraction is entirely data-driven: this file calls
 * `matchAllPatterns()` from kb-lib/patterns/registry.ts, which iterates the
 * Pattern Registry (a list of named, documented matchers) — it contains no
 * inline condition regexes of its own. Every fired pattern ID is recorded on
 * the rule (`patternIds`) and tallied by kb-parser-stats.ts.
 *
 * What this script does NOT do (intentionally, to avoid fabricating
 * structure that isn't really there):
 *   - It does not invent a structuredRule when no pattern in the registry
 *     matches. Most rules carry structuredRule: null and their full text in
 *     `translation` for a human to structure.
 *   - It never assigns a numeric outcome weight — RuleEffect.direction is
 *     only set when the text itself uses an unambiguous polarity word.
 *   - It does not claim a real Sanskrit transcription. `originalVerse` is a
 *     best-effort guess at OCR garble preceding a translation, always
 *     flagged `originalVerseReliable: false`.
 *   - It does not separate "commentary" from "translation" — always null.
 *
 * Adding a new book requires no changes here — only a new book.json.
 * Adding a new condition pattern requires no changes here — only a new
 * entry in kb-lib/patterns/registry.ts.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, EXTRACTED_DIR, PROCESSED_DIR, RULES_DIR, type BookMeta } from './kb-lib/registry';
import { classifyCategories, PLANETS, SIGNS, NAKSHATRAS, DOMAIN_CATEGORIES } from './kb-lib/categories';
import { SECONDARY_POINTS } from './kb-lib/patterns/slots';
import { matchAllPatterns } from './kb-lib/patterns/registry';
import type { Rule, StructuredRule, RuleDimensions, RuleEffect, RuleTiming, RuleRemedy } from './kb-lib/rule-schema';

interface SentenceRecord {
  id: string;
  book: string;
  page: number;
  chapter: string | null;
  verse: string | null;
  text: string;
  ocrConfidence: number | null;
  extractionConfidence: number;
  charLen: number;
}

// --- Dimension extraction (entity mentions, independent of the condition Pattern Registry) ---
const PLANET_RE_G = new RegExp(`\\b(${PLANETS.join('|')})\\b`, 'gi');
const SECONDARY_POINT_RE_G = new RegExp(`\\b(${SECONDARY_POINTS.join('|')})\\b`, 'gi');
const HOUSE_WORD_ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6,
  seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
};
const HOUSE_ORDINAL_RE_G = new RegExp(
  `\\b((?:1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)|(?:${Object.keys(HOUSE_WORD_ORDINALS).join('|')}))\\s+(?:house|bhava)\\b`,
  'gi',
);
const LAGNA_RE = /\b(lagna|ascendant)\b/i;
const SIGN_RE_G = new RegExp(`\\b(${SIGNS.join('|')})\\b`, 'gi');
const NAKSHATRA_RE_G = new RegExp(`\\b(${NAKSHATRAS.join('|')})\\b`, 'gi');
const YOGA_NAME_RE_G = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\)?\s+Yoga\b/g;
const DASHA_PLANET_RE_G = new RegExp(`\\b(${PLANETS.join('|')})\\s*['']?s?\\s+(?:dasha|dasa|bhukti)\\b`, 'gi');
const DIVISIONAL_RE_G = /\b(navamsa|hora|drekkana|d-?9|d-?10|d-?7|d-?12|vimsamsa|shodasavarga)\b/gi;

const AGE_YEARS_RE = /\bat the age of (\d{1,3})\b|\bin the (\d{1,3})(?:st|nd|rd|th)?\s+year\b|\b(\d{1,3})\s+years?\s+of\s+age\b/i;
const REMEDY_VERB_RE = /\b(wear|wearing|don|donate|donating|chant|chanting|recite|reciting|observe|observing|fast|fasting|propitiate|propitiating|worship|worshipping)\b/i;
const REMEDY_TYPE_RE: Array<[RegExp, RuleRemedy['type']]> = [
  [/\b(ruby|pearl|emerald|coral|topaz|diamond|sapphire|gemstone|gem)\b/i, 'gemstone'],
  [/\bmantra\b/i, 'mantra'],
  [/\bdonat\w*\b/i, 'donation'],
  [/\bfast\w*\b/i, 'fasting'],
  // Ordered after the 4 above: a sentence naming both a gemstone and worship
  // should still resolve to the more concrete 'gemstone' prescription.
  [/\b(worship|puja|pooja|homa|havan|temple\s+visit|deity)\b/i, 'worship'],
];
// Narrower than REMEDY_VERB_RE on purpose: only fires as a fallback (see
// tryParseLifestyleRemedy) when nothing above matched, so it never
// recategorizes a concrete gemstone/mantra/donation/fasting/worship rule.
const LIFESTYLE_REMEDY_RE = /\b(should|must|ought to)\s+(avoid|abstain from|observe|practice|maintain|refrain from|control|cultivate|serve|respect)\b/i;
const INCREASE_RE = /\b(gain|gains|increase|increases|prosperity|wealthy|success|successful|auspicious|beneficial|happiness|fame|growth|favourable|favorable)\b/i;
const DECREASE_RE = /\b(loss|losses|decrease|decreases|trouble|troubles|misery|inauspicious|harm|danger|poverty|disease|suffering|affliction|unfavourable|unfavorable|malefic)\b/i;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function houseOrdinalToNum(raw: string): number {
  const lower = raw.toLowerCase();
  const digitMatch = lower.match(/^(\d+)/);
  if (digitMatch) return Number(digitMatch[1]);
  return HOUSE_WORD_ORDINALS[lower]!;
}

function extractDimensions(text: string): RuleDimensions {
  const planets = [...new Set([...(text.match(PLANET_RE_G) ?? [])].map(capitalize))];
  const secondaryPoints = [...new Set([...(text.match(SECONDARY_POINT_RE_G) ?? [])].map(capitalize))];
  const houseNums = [...text.matchAll(HOUSE_ORDINAL_RE_G)].map((m) => houseOrdinalToNum(m[1]!));
  if (LAGNA_RE.test(text)) houseNums.push(1);
  const houses = [...new Set(houseNums)];
  const signs = [...new Set([...(text.match(SIGN_RE_G) ?? [])].map(capitalize))];
  const nakshatras = [...new Set([...(text.match(NAKSHATRA_RE_G) ?? [])].map(capitalize))];
  const yogas = [...new Set([...text.matchAll(YOGA_NAME_RE_G)].map((m) => `${m[1]} Yoga`))];
  const dashaPlanets = [...new Set([...text.matchAll(DASHA_PLANET_RE_G)].map((m) => capitalize(m[1]!)))];
  const divisionalCharts = [...new Set([...(text.match(DIVISIONAL_RE_G) ?? [])].map((s) => s.toLowerCase()))];
  const remedyTypes: string[] = [];
  if (/gemstone/i.test(text)) remedyTypes.push('gemstone');
  if (/mantra/i.test(text)) remedyTypes.push('mantra');
  if (/donation/i.test(text)) remedyTypes.push('donation');
  if (/fasting/i.test(text)) remedyTypes.push('fasting');
  if (/\b(worship|puja|pooja|homa|havan)\b/i.test(text)) remedyTypes.push('worship');
  return { planets, secondaryPoints, houses, signs, nakshatras, yogas, dashaPlanets, divisionalCharts, remedyTypes };
}

function detectEffect(text: string, categories: string[]): RuleEffect {
  const domain = categories.find((c) => DOMAIN_CATEGORIES.includes(c)) ?? null;
  const inc = INCREASE_RE.test(text);
  const dec = DECREASE_RE.test(text);
  const direction: RuleEffect['direction'] = inc && !dec ? 'increase' : dec && !inc ? 'decrease' : 'unspecified';
  return { domain, direction, text };
}

/** Only set when the text explicitly states a numeric age/year — never inferred from the 'timing' category alone. */
function tryParseTiming(text: string): RuleTiming | null {
  const m = text.match(AGE_YEARS_RE);
  if (!m) return null;
  const ageStr = m[1] ?? m[2] ?? m[3];
  return { ageYears: ageStr ? Number(ageStr) : null, raw: m[0] };
}

/** Only set when the text both prescribes an action verb AND names a specific remedy type — never inferred from the 'remedies' category alone. */
function tryParseRemedy(text: string): RuleRemedy | null {
  if (!REMEDY_VERB_RE.test(text)) return null;
  for (const [pattern, type] of REMEDY_TYPE_RE) {
    const m = text.match(pattern);
    if (m) return { type, raw: `${text.match(REMEDY_VERB_RE)![0]} ... ${m[0]}` };
  }
  return null;
}

/**
 * Best-effort, deliberately conservative behavioral/lifestyle remedy detector.
 * Called ONLY when tryParseRemedy() found nothing, so it never recategorizes
 * a rule that already has a concrete gemstone/mantra/donation/fasting/worship
 * prescription. Requires both: (1) the sentence already independently
 * classified into the 'remedies' category (categories.ts), and (2) an
 * explicit prescriptive-modal + behavior-verb co-occurrence — narrower than
 * REMEDY_VERB_RE, no bare verbs. Precision/recall unverified until run
 * against real book text; expect tuning after inspecting kb:report output.
 */
function tryParseLifestyleRemedy(text: string, categories: string[]): RuleRemedy | null {
  if (!categories.includes('remedies')) return null;
  const m = text.match(LIFESTYLE_REMEDY_RE);
  if (!m) return null;
  return { type: 'lifestyle', raw: m[0] };
}

/** Crude OCR-garble detector: fraction of "words" that don't look like ordinary English tokens. */
function garbleScore(line: string): number {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  const looksEnglish = (w: string) => /^[A-Za-z']{2,}$/.test(w) && /[aeiouAEIOU]/.test(w);
  const bad = words.filter((w) => !looksEnglish(w)).length;
  return bad / words.length;
}

/** Best-effort, explicitly unreliable: looks for a garbled block immediately preceding the sentence on its source page. */
function findOriginalVerseCandidate(pageText: string, sentence: string): string | null {
  const probe = sentence.slice(0, Math.min(30, sentence.length));
  const lines = pageText.split('\n');
  const idx = lines.findIndex((l) => l.includes(probe));
  if (idx <= 0) return null;
  const preceding = lines.slice(Math.max(0, idx - 2), idx).map((l) => l.trim()).filter(Boolean);
  if (preceding.length === 0) return null;
  const avgGarble = preceding.reduce((sum, l) => sum + garbleScore(l), 0) / preceding.length;
  const joined = preceding.join(' ');
  if (avgGarble > 0.55 && joined.length > 10) return joined;
  return null;
}

function computePriority(extractionConfidence: number, hasChapterAndVerse: boolean, hasStructuredRule: boolean, book: BookMeta): number {
  let score = extractionConfidence;
  if (hasChapterAndVerse) score += 0.3;
  if (hasStructuredRule) score += 0.2;
  if (book.classicalAuthority === 'primary') score += 0.1;
  if (score >= 1.4) return 1;
  if (score >= 1.1) return 2;
  if (score >= 0.8) return 3;
  if (score >= 0.5) return 4;
  return 5;
}

function sanitizeForId(value: string | null): string {
  if (value == null) return 'UNK';
  return value.replace(/[^a-zA-Z0-9]+/g, 'x');
}

/** Pattern-fire tally across the whole run, written by kb-parser-stats.ts consumers. */
export interface PatternStatEntry {
  matchCount: number;
  samples: Array<{ ruleId: string; raw: string; sentence: string }>;
}

function encodeBook(book: BookMeta, patternStats: Map<string, PatternStatEntry>) {
  const sentencesPath = join(EXTRACTED_DIR, book.slug, 'sentences.jsonl');
  if (!existsSync(sentencesPath)) {
    console.error(`SKIP ${book.slug}: no segmented sentences at ${sentencesPath} (run kb:segment first)`);
    return;
  }
  const sentences = readFileSync(sentencesPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as SentenceRecord);

  const pageTextCache = new Map<number, string>();
  const loadPageText = (page: number): string => {
    if (pageTextCache.has(page)) return pageTextCache.get(page)!;
    const path = join(PROCESSED_DIR, book.slug, `page-${String(page).padStart(4, '0')}.txt`);
    const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
    pageTextCache.set(page, text);
    return text;
  };

  const idSeqByChapterVerse = new Map<string, number>();
  const rules: Rule[] = [];
  const seenText = new Set<string>(); // de-dup identical sentence text within THIS book only

  for (const s of sentences) {
    if (s.charLen < 20) continue; // too short to be a meaningful rule candidate
    if (s.extractionConfidence < 0.15) continue; // OCR too unreliable to encode
    const dedupeKey = s.text.trim().toLowerCase();
    if (seenText.has(dedupeKey)) continue;
    seenText.add(dedupeKey);

    const categories = classifyCategories(s.text);
    if (categories.length === 0) continue; // doesn't touch any recognized astrological topic

    const { conditions, firedPatternIds, matches } = matchAllPatterns(s.text);
    const structuredRule: StructuredRule | null =
      conditions.length === 0 ? null : { conditions, effect: detectEffect(s.text, categories) };

    const key = `${sanitizeForId(s.chapter)}_${sanitizeForId(s.verse)}`;
    const seq = (idSeqByChapterVerse.get(key) ?? 0) + 1;
    idSeqByChapterVerse.set(key, seq);
    const id = `${book.code}_CH${sanitizeForId(s.chapter)}_V${sanitizeForId(s.verse)}_R${String(seq).padStart(3, '0')}`;

    for (const { patternId, condition } of matches) {
      const entry = patternStats.get(patternId) ?? { matchCount: 0, samples: [] };
      entry.matchCount += 1;
      if (entry.samples.length < 5) {
        entry.samples.push({ ruleId: id, raw: condition.raw, sentence: s.text });
      }
      patternStats.set(patternId, entry);
    }

    const originalVerse = findOriginalVerseCandidate(loadPageText(s.page), s.text);

    rules.push({
      id,
      version: 1,
      status: 'draft',
      book: book.slug,
      bookCode: book.code,
      chapter: s.chapter,
      verse: s.verse,
      page: s.page,
      priority: computePriority(s.extractionConfidence, Boolean(s.chapter && s.verse), Boolean(structuredRule), book),
      categories,
      dimensions: extractDimensions(s.text),
      structuredRule,
      patternIds: firedPatternIds,
      isComposite: conditions.length >= 2,
      timing: tryParseTiming(s.text),
      remedy: tryParseRemedy(s.text) ?? tryParseLifestyleRemedy(s.text, categories),
      originalVerse,
      originalVerseReliable: false,
      translation: s.text,
      commentary: null,
      relatedRuleIds: [],
      requiresRuleIds: [],
      ocrConfidence: s.ocrConfidence,
      extractionConfidence: s.extractionConfidence,
      validationConfidence: null,
      inferenceWeight: null,
      sourceSentenceId: s.id,
      createdAt: new Date().toISOString(),
    });
  }

  mkdirSync(join(RULES_DIR, book.slug), { recursive: true });
  const outPath = join(RULES_DIR, book.slug, 'rules.jsonl');
  writeFileSync(outPath, rules.map((r) => JSON.stringify(r)).join('\n') + (rules.length ? '\n' : ''), 'utf8');

  const withStructured = rules.filter((r) => r.structuredRule != null).length;
  const composite = rules.filter((r) => r.isComposite).length;
  const byPriority = [1, 2, 3, 4, 5].map((p) => rules.filter((r) => r.priority === p).length);
  console.log(
    `DONE ${book.slug}: ${rules.length} draft rules (structured=${withStructured}, composite=${composite}, unstructured=${rules.length - withStructured}) ` +
      `priority 1-5 = [${byPriority.join(', ')}] → ${outPath}`,
  );
}

function main() {
  mkdirSync(RULES_DIR, { recursive: true });
  const only = process.argv[2];
  const patternStats = new Map<string, PatternStatEntry>();
  for (const book of loadBookRegistry()) {
    if (only && book.slug !== only) continue;
    encodeBook(book, patternStats);
  }
  mkdirSync(RULES_DIR, { recursive: true });
  const statsOut = Object.fromEntries(patternStats);
  writeFileSync(join(RULES_DIR, 'pattern-match-log.json'), JSON.stringify(statsOut, null, 2), 'utf8');
}

main();
