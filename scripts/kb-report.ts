/**
 * Pre-encoding statistics (see project instructions): for every registered
 * book, report page counts and a coarse, keyword-based CANDIDATE count per
 * rule category.
 *
 * These category counts are a triage signal only — "how much of this book
 * plausibly touches marriage / career / yogas / etc." — not validated rules.
 * Validation happens in the next phase (Rule Validation), after a human
 * reviews kb/rules/<book>/rules.jsonl. Nothing here is asserted as fact.
 *
 * Reads kb/processed/<book>/manifest.json + kb/extracted/<book>/sentences.jsonl.
 * Writes kb/reports/<book>.stats.json (machine-readable) and prints a table.
 * Adding a new book requires no changes here — only a new book.json.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, PROCESSED_DIR, EXTRACTED_DIR, REPORTS_DIR } from './kb-lib/registry';
import { CATEGORY_PATTERNS } from './kb-lib/categories';

interface SentenceRecord {
  book: string;
  page: number;
  chapter: string | null;
  verse: string | null;
  text: string;
}

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

function classify(text: string): string[] {
  const hits: string[] = [];
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(text)) hits.push(category);
  }
  return hits;
}

function reportBook(slug: string, title: string) {
  const manifestPath = join(PROCESSED_DIR, slug, 'manifest.json');
  const sentencesPath = join(EXTRACTED_DIR, slug, 'sentences.jsonl');
  if (!existsSync(manifestPath)) {
    console.error(`SKIP ${slug}: no extraction manifest at ${manifestPath}`);
    return;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ExtractionManifest;

  const counts: Record<string, number> = {};
  for (const category of Object.keys(CATEGORY_PATTERNS)) counts[category] = 0;
  let candidateSentences = 0;
  let totalSentences = 0;

  if (existsSync(sentencesPath)) {
    const lines = readFileSync(sentencesPath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line) as SentenceRecord;
      totalSentences += 1;
      const hits = classify(record.text);
      if (hits.length > 0) candidateSentences += 1;
      for (const h of hits) counts[h] = (counts[h] ?? 0) + 1;
    }
  } else {
    console.error(`WARN ${slug}: no segmented sentences at ${sentencesPath} (run kb:segment first)`);
  }

  const stats = {
    book: title,
    slug,
    pages: manifest.totalPages,
    ocrPages: manifest.ocrPages,
    digitalPages: manifest.digitalPages,
    avgOcrConfidence: manifest.avgOcrConfidence,
    totalSentencesExtracted: totalSentences,
    candidateRuleSentences: candidateSentences,
    candidateCounts: counts,
    skippedPages: manifest.skippedPages,
    note: 'candidateCounts are a coarse keyword triage signal, not validated rules — see Rule Validation phase',
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, `${slug}.stats.json`), JSON.stringify(stats, null, 2), 'utf8');

  console.log(`\n=== ${stats.book} ===`);
  console.log(`Pages:               ${stats.pages}`);
  console.log(`OCR pages:           ${stats.ocrPages}`);
  console.log(`Digital pages:       ${stats.digitalPages}`);
  console.log(`Avg OCR confidence:  ${stats.avgOcrConfidence?.toFixed(2) ?? 'n/a'}`);
  console.log(`Candidate rules:     ${stats.candidateRuleSentences} / ${stats.totalSentencesExtracted} sentences`);
  for (const [category, count] of Object.entries(counts)) {
    console.log(`  ${category.padEnd(20)} ${count}`);
  }
  console.log(`Skipped pages:       ${stats.skippedPages.length ? stats.skippedPages.join(', ') : 'none'}`);
}

function main() {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const only = process.argv[2];
  for (const book of loadBookRegistry()) {
    if (only && book.slug !== only) continue;
    reportBook(book.slug, book.title);
  }
}

main();
