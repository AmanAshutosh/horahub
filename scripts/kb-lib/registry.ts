/**
 * Book registry: every book registers itself via kb/sources/books/<slug>.book.json.
 * Adding a new book to the pipeline never requires touching kb-extract.ts,
 * kb-segment.ts, kb-report.ts, or kb-encode.ts — only a new PDF + book.json.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
export const BOOKS_REGISTRY_DIR = join(ROOT, 'kb', 'sources', 'books');
export const SOURCES_DIR = join(ROOT, 'kb', 'sources');
export const PROCESSED_DIR = join(ROOT, 'kb', 'processed');
export const EXTRACTED_DIR = join(ROOT, 'kb', 'extracted');
export const RULES_DIR = join(ROOT, 'kb', 'rules');
export const REPORTS_DIR = join(ROOT, 'kb', 'reports');
export const CACHE_DIR = join(ROOT, 'kb', 'cache');

export type ClassicalAuthority = 'primary' | 'secondary' | 'commentary' | 'modern';
export type Copyright = 'public-domain' | 'in-copyright' | 'unknown';
export type ExtractionStrategy = 'text' | 'ocr';

export interface ChapterMatcherConfig {
  pattern: string;
  flags: string;
  isEndMarker?: boolean;
  /**
   * Fixed chapter number to use on a match, instead of parsing one out of the
   * matched text. Needed for books whose real chapter-start heading (e.g. a
   * recurring running header like "Concerning the Seventh House") never
   * carries a digit or Roman numeral in the body — only in the table of
   * contents, which isn't reliably attributable line-by-line.
   */
  chapterNumber?: number;
}

export interface VersePatternConfig {
  pattern: string;
  flags: string;
}

export interface SegmentationConfig {
  chapterMatchers: ChapterMatcherConfig[];
  versePattern: VersePatternConfig | null;
  capsHeadingHeuristic?: boolean;
  /**
   * Like capsHeadingHeuristic, but for books whose section headings are
   * short Title Case topic lines rather than ALL-CAPS or numbered headings
   * (e.g. "Model Exercise", "The Spirituality Associated with Houses").
   * The matched line text itself becomes the chapter label, same as
   * capsHeadingHeuristic — there is no numeric chapter index to parse.
   */
  titleCaseHeadingHeuristic?: boolean;
}

export interface BookMeta {
  slug: string;
  /** Short uppercase code used as the prefix of every permanent rule ID for this book, e.g. "BPHS". */
  code: string;
  title: string;
  author: string;
  translator: string | null;
  edition: string;
  language: string;
  /** Lower = higher classical authority when the same principle is cross-referenced across books. */
  priority: number;
  classicalAuthority: ClassicalAuthority;
  copyright: Copyright;
  file: string;
  pages: number;
  extractionStrategy: ExtractionStrategy;
  textFallbackThreshold: number;
  ocrQuality: 'good' | 'fair' | 'poor' | 'unknown';
  segmentation: SegmentationConfig;
}

export function loadBookRegistry(): BookMeta[] {
  const files = readdirSync(BOOKS_REGISTRY_DIR).filter((f) => f.endsWith('.book.json'));
  return files
    .map((f) => JSON.parse(readFileSync(join(BOOKS_REGISTRY_DIR, f), 'utf8')) as BookMeta)
    .sort((a, b) => a.priority - b.priority);
}

export function compileChapterMatchers(config: SegmentationConfig) {
  return config.chapterMatchers.map((m) => ({
    pattern: new RegExp(m.pattern, m.flags),
    isEndMarker: m.isEndMarker ?? false,
    chapterNumber: m.chapterNumber,
  }));
}

export function compileVersePattern(config: SegmentationConfig): RegExp | null {
  return config.versePattern ? new RegExp(config.versePattern.pattern, config.versePattern.flags) : null;
}
