/**
 * Final reporting pass. Generates the six reports requested before any
 * further KB work proceeds: Extraction, Rule Statistics, Rule Quality,
 * Conflict, OCR, and Category Coverage. Reads only already-written
 * artifacts (kb/processed manifests, kb/rules/*.jsonl, kb/reports/conflicts.json)
 * — computes no new extraction or encoding.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, PROCESSED_DIR, RULES_DIR, REPORTS_DIR } from './kb-lib/registry';
import { CATEGORY_PATTERNS } from './kb-lib/categories';
import type { Rule } from './kb-lib/rule-schema';

interface ExtractionManifest {
  slug: string;
  code: string;
  title: string;
  totalPages: number;
  digitalPages: number;
  ocrPages: number;
  skippedPages: number[];
  avgOcrConfidence: number | null;
}

function loadRules(slug: string): Rule[] {
  const path = join(RULES_DIR, slug, 'rules.jsonl');
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Rule);
}

function main() {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const books = loadBookRegistry();

  // ---- 1. Extraction Report ----
  const extraction = books.map((book) => {
    const path = join(PROCESSED_DIR, book.slug, 'manifest.json');
    if (!existsSync(path)) return { slug: book.slug, title: book.title, status: 'not extracted' };
    const m = JSON.parse(readFileSync(path, 'utf8')) as ExtractionManifest;
    return {
      slug: book.slug,
      title: book.title,
      pages: m.totalPages,
      digitalPages: m.digitalPages,
      ocrPages: m.ocrPages,
      skippedPages: m.skippedPages.length,
      avgOcrConfidence: m.avgOcrConfidence,
    };
  });
  writeFileSync(join(REPORTS_DIR, 'summary-extraction.json'), JSON.stringify(extraction, null, 2), 'utf8');

  // ---- 2. Rule Statistics ----
  const ruleStats = books.map((book) => {
    const rules = loadRules(book.slug);
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const r of rules) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
    }
    return {
      slug: book.slug,
      title: book.title,
      totalRules: rules.length,
      structuredRules: rules.filter((r) => r.structuredRule != null).length,
      compositeRules: rules.filter((r) => r.isComposite).length,
      byStatus,
      byPriority,
    };
  });
  const totalRules = ruleStats.reduce((a, b) => a + b.totalRules, 0);
  writeFileSync(
    join(REPORTS_DIR, 'summary-rule-statistics.json'),
    JSON.stringify({ totalRulesAllBooks: totalRules, byBook: ruleStats }, null, 2),
    'utf8',
  );

  // ---- 3. Rule Quality Report ----
  const quality = books.map((book) => {
    const rules = loadRules(book.slug);
    if (rules.length === 0) return { slug: book.slug, title: book.title, totalRules: 0 };
    const withChapterAndVerse = rules.filter((r) => r.chapter && r.verse).length;
    const withOriginalVerseCandidate = rules.filter((r) => r.originalVerse != null).length;
    const avgExtractionConfidence = rules.reduce((a, r) => a + r.extractionConfidence, 0) / rules.length;
    const lowConfidenceRules = rules.filter((r) => r.extractionConfidence < 0.5).length;
    return {
      slug: book.slug,
      title: book.title,
      totalRules: rules.length,
      pctWithChapterAndVerse: Number(((withChapterAndVerse / rules.length) * 100).toFixed(1)),
      pctStructured: Number(((rules.filter((r) => r.structuredRule != null).length / rules.length) * 100).toFixed(1)),
      avgExtractionConfidence: Number(avgExtractionConfidence.toFixed(3)),
      lowConfidenceRules,
      originalVerseCandidates: withOriginalVerseCandidate,
      note: 'originalVerseCandidates are unreliable OCR-garble guesses, not verified Sanskrit — see rule-schema.ts',
    };
  });
  writeFileSync(join(REPORTS_DIR, 'summary-rule-quality.json'), JSON.stringify(quality, null, 2), 'utf8');

  // ---- 4. Conflict Report (reference existing kb-conflicts.ts output) ----
  const conflictsPath = join(REPORTS_DIR, 'conflicts.json');
  const conflictSummary = existsSync(conflictsPath)
    ? (() => {
        const c = JSON.parse(readFileSync(conflictsPath, 'utf8'));
        return { crossBookOverlaps: c.crossBookOverlaps, directConflicts: c.directConflicts, fullReport: 'kb/reports/conflicts.json' };
      })()
    : { note: 'run kb:conflicts first' };
  writeFileSync(join(REPORTS_DIR, 'summary-conflicts.json'), JSON.stringify(conflictSummary, null, 2), 'utf8');

  // ---- 5. OCR Report ----
  const ocr = books.map((book) => {
    const path = join(PROCESSED_DIR, book.slug, 'manifest.json');
    if (!existsSync(path)) return { slug: book.slug, status: 'not extracted' };
    const m = JSON.parse(readFileSync(path, 'utf8')) as ExtractionManifest;
    return {
      slug: book.slug,
      title: book.title,
      ocrPages: m.ocrPages,
      digitalPages: m.digitalPages,
      avgOcrConfidence: m.avgOcrConfidence,
      skippedPages: m.skippedPages,
    };
  });
  writeFileSync(join(REPORTS_DIR, 'summary-ocr.json'), JSON.stringify(ocr, null, 2), 'utf8');

  // ---- 6. Category Coverage Report ----
  const categoryNames = Object.keys(CATEGORY_PATTERNS);
  const coverage = books.map((book) => {
    const rules = loadRules(book.slug);
    const counts: Record<string, number> = {};
    for (const cat of categoryNames) counts[cat] = 0;
    for (const r of rules) for (const c of r.categories) counts[c] = (counts[c] ?? 0) + 1;
    return { slug: book.slug, title: book.title, totalRules: rules.length, counts };
  });
  const totals: Record<string, number> = {};
  for (const cat of categoryNames) totals[cat] = coverage.reduce((a, b) => a + (b.counts[cat] ?? 0), 0);
  writeFileSync(
    join(REPORTS_DIR, 'summary-category-coverage.json'),
    JSON.stringify({ totals, byBook: coverage }, null, 2),
    'utf8',
  );

  // ---- console summary ----
  console.log('\n=== Extraction ===');
  for (const e of extraction) console.log(JSON.stringify(e));
  console.log('\n=== Rule Statistics ===');
  console.log(`Total rules across all books: ${totalRules}`);
  for (const r of ruleStats) console.log(`  ${r.title}: ${r.totalRules} (structured=${r.structuredRules}, composite=${r.compositeRules})`);
  console.log('\n=== Rule Quality ===');
  for (const q of quality) console.log(JSON.stringify(q));
  console.log('\n=== Conflicts ===');
  console.log(JSON.stringify(conflictSummary));
  console.log('\n=== OCR ===');
  for (const o of ocr) console.log(JSON.stringify(o));
  console.log('\n=== Category Coverage (totals) ===');
  console.log(JSON.stringify(totals, null, 2));
  console.log('\nAll six reports written to kb/reports/summary-*.json');
}

main();
