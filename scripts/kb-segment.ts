/**
 * Stage 3 of the KB pipeline (see docs/KB_PIPELINE.md): segment.
 *
 * Reads kb/processed/<book>/page-*.txt (raw OCR/digital text) and splits it
 * into sentence-level units tagged with the chapter/verse markers detected
 * in the surrounding text, per the segmentation config in each book's
 * kb/sources/books/<slug>.book.json. Chapter/verse attribution is a
 * heuristic regex match against noisy OCR output, NOT a verified citation —
 * that happens at the (future) Rule Validation stage. `boundaryConfidence`
 * records whether a unit's chapter/verse was freshly matched on its own page
 * (1.0) or carried over from an earlier page with no fresh marker since (0.6).
 *
 * Output: kb/extracted/<book>/sentences.jsonl (one JSON object per line).
 * Every record carries full traceability: book, page, chapter, verse,
 * ocrConfidence (inherited from the source page), extractionConfidence
 * (page confidence × boundaryConfidence).
 *
 * Adding a new book requires no changes here — only a new book.json.
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadBookRegistry,
  compileChapterMatchers,
  compileVersePattern,
  PROCESSED_DIR,
  EXTRACTED_DIR,
  type BookMeta,
} from './kb-lib/registry';

interface PageMeta {
  book: string;
  page: number;
  source: 'digital' | 'ocr';
  chars: number;
  ocrConfidence: number | null;
  extractionConfidence: number;
}

function romanToInt(roman: string): number | null {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const s = roman.toUpperCase();
  if (!/^[IVXLCDM]+$/.test(s)) return null;
  let total = 0;
  for (let i = 0; i < s.length; i += 1) {
    const cur = map[s[i]!]!;
    const next = map[s[i + 1]!];
    if (next && cur < next) total -= cur;
    else total += cur;
  }
  return total;
}

function isCapsHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 5 || t.length > 58) return false;
  if (!/^[A-Z][A-Z\s'-]+$/.test(t)) return false;
  return t.replace(/[^A-Z]/g, '').length >= 5;
}

const TITLE_CASE_CONNECTORS = new Set([
  'in', 'of', 'the', 'and', 'a', 'an', 'on', 'to', 'at', 'from', 'by', 'with', 'your', 'this', 'or',
]);

/**
 * True for a short standalone line where every word is either Title Case
 * or a common lowercase connector — e.g. "The Spirituality Associated with
 * Houses" — and false for ordinary prose (which mixes in lowercase content
 * words) or noisy OCR garble (which rarely produces clean capitalization).
 */
function isTitleCaseHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 5 || t.length > 60) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 10) return false;
  return words.every((w, i) => {
    const lower = w.toLowerCase();
    if (i > 0 && TITLE_CASE_CONNECTORS.has(lower)) return true;
    return /^[A-Z][a-z']*$/.test(w);
  });
}

function splitSentences(paragraph: string): string[] {
  const cleaned = paragraph.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
  return parts.map((p) => p.trim()).filter((p) => p.length >= 15);
}

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

function segmentBook(book: BookMeta) {
  const bookDir = join(PROCESSED_DIR, book.slug);
  if (!existsSync(bookDir)) {
    console.error(`SKIP ${book.slug}: no processed text at ${bookDir}`);
    return;
  }
  const chapterMatchers = compileChapterMatchers(book.segmentation);
  const versePattern = compileVersePattern(book.segmentation);
  const capsHeadingHeuristic = book.segmentation.capsHeadingHeuristic ?? false;
  const titleCaseHeadingHeuristic = book.segmentation.titleCaseHeadingHeuristic ?? false;

  const pageFiles = readdirSync(bookDir)
    .filter((f) => /^page-\d{4}\.txt$/.test(f))
    .sort();

  let currentChapter: string | null = null;
  let currentVerse: string | null = null;
  const records: SentenceRecord[] = [];
  let seq = 0;

  for (const pageFile of pageFiles) {
    const page = Number(pageFile.match(/(\d{4})/)![1]);
    const text = readFileSync(join(bookDir, pageFile), 'utf8');
    const metaPath = join(bookDir, pageFile.replace('.txt', '.meta.json'));
    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as PageMeta;

    let chapterMatchedThisPage = false;
    const lines = text.split('\n');
    let paragraphBuf: string[] = [];

    const flushParagraph = () => {
      if (paragraphBuf.length === 0) return;
      const paragraph = paragraphBuf.join(' ');
      paragraphBuf = [];
      for (const sentence of splitSentences(paragraph)) {
        const boundaryConfidence = chapterMatchedThisPage ? 1 : 0.6;
        records.push({
          id: `${book.slug}-p${String(page).padStart(4, '0')}-${String(seq).padStart(3, '0')}`,
          book: book.slug,
          page,
          chapter: currentChapter,
          verse: currentVerse,
          text: sentence,
          ocrConfidence: meta.ocrConfidence,
          extractionConfidence: Number((meta.extractionConfidence * boundaryConfidence).toFixed(3)),
          charLen: sentence.length,
        });
        seq += 1;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        continue;
      }

      let matchedHere = false;
      for (const matcher of chapterMatchers) {
        const m = line.match(matcher.pattern);
        if (m) {
          if (matcher.chapterNumber != null) {
            currentChapter = String(matcher.isEndMarker ? matcher.chapterNumber + 1 : matcher.chapterNumber);
            currentVerse = null;
            matchedHere = true;
            break;
          }
          const raw = m[1] ?? m[2];
          if (!raw) continue;
          const asRoman = romanToInt(raw);
          const num = asRoman ?? (Number.isFinite(Number(raw)) ? Number(raw) : null);
          if (num != null) {
            currentChapter = String(matcher.isEndMarker ? num + 1 : num);
            currentVerse = null; // new chapter resets verse tracking
            matchedHere = true;
          }
          break;
        }
      }
      if (matchedHere) {
        chapterMatchedThisPage = true;
        continue; // heading lines aren't content
      }

      if (capsHeadingHeuristic && isCapsHeading(line)) {
        currentChapter = line;
        chapterMatchedThisPage = true;
        continue;
      }

      if (titleCaseHeadingHeuristic && isTitleCaseHeading(line)) {
        currentChapter = line;
        chapterMatchedThisPage = true;
        continue;
      }

      if (versePattern) {
        const vm = line.match(versePattern);
        if (vm) {
          currentVerse = vm[1] ?? vm[2] ?? currentVerse;
        }
      }

      paragraphBuf.push(line);
    }
    flushParagraph();
  }

  mkdirSync(join(EXTRACTED_DIR, book.slug), { recursive: true });
  const outPath = join(EXTRACTED_DIR, book.slug, 'sentences.jsonl');
  writeFileSync(outPath, records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''), 'utf8');
  const withChapter = records.filter((r) => r.chapter != null).length;
  const withVerse = records.filter((r) => r.verse != null).length;
  console.log(
    `DONE ${book.slug}: ${records.length} sentences (chapter-tagged=${withChapter}, verse-tagged=${withVerse}) → ${outPath}`,
  );
}

function main() {
  mkdirSync(EXTRACTED_DIR, { recursive: true });
  const only = process.argv[2];
  for (const book of loadBookRegistry()) {
    if (only && book.slug !== only) continue;
    segmentBook(book);
  }
}

main();
