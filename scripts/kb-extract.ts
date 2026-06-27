/**
 * Stage 1–2 of the KB pipeline (see docs/KB_PIPELINE.md): extract + normalize.
 *
 * Reads every book registered in kb/sources/books/*.book.json (read-only —
 * source PDFs are never modified) and writes raw per-page text into
 * kb/processed/<book>/ — embedded text layer where it's clean, fresh
 * Tesseract OCR where it isn't or the page is a scanned image. Rasterized
 * page images are written to kb/cache/ and deleted after OCR.
 *
 * The whole kb/ tree (except the committed src/kb/rules/*.json elsewhere) is
 * git-ignored, so no copyrighted source text ever reaches the repository.
 *
 * Resumable: a page already written to disk is skipped on re-run.
 * Adding a new book requires no changes here — only a new book.json.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadBookRegistry, SOURCES_DIR, PROCESSED_DIR, CACHE_DIR, REPORTS_DIR, type BookMeta } from './kb-lib/registry';

const POPPLER_BIN =
  process.env.POPPLER_BIN ??
  'C:/Users/ASUS/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin';
const TESSERACT_EXE = process.env.TESSERACT_EXE ?? 'C:/Program Files/Tesseract-OCR/tesseract.exe';
const PDFTOTEXT = join(POPPLER_BIN, 'pdftotext.exe');
const PDFTOPPM = join(POPPLER_BIN, 'pdftoppm.exe');

type PageSource = 'digital' | 'ocr';

interface PageMeta {
  book: string;
  page: number;
  source: PageSource;
  chars: number;
  ocrConfidence: number | null; // 0..1, null for digital-text pages
  extractionConfidence: number; // 0..1, overall trust in this page's text
  extractedAt: string;
}

function nonWhitespaceLength(s: string): number {
  return s.replace(/\s/g, '').length;
}

function extractDigitalText(pdfPath: string, page: number): string {
  return execFileSync(PDFTOTEXT, ['-layout', '-f', String(page), '-l', String(page), pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
  });
}

/** Rasterizes one page, OCRs it, and returns both the text and Tesseract's mean word confidence (0..1). */
function ocrPage(pdfPath: string, page: number, cacheDir: string): { text: string; confidence: number } {
  const base = `p${page}-${Date.now()}`;
  execFileSync(
    PDFTOPPM,
    ['-png', '-r', '300', '-f', String(page), '-l', String(page), pdfPath, join(cacheDir, base)],
    { maxBuffer: 1024 * 1024 * 32 },
  );
  const match = readdirSync(cacheDir).find((f) => f.startsWith(`${base}-`) && f.endsWith('.png'));
  if (!match) throw new Error(`pdftoppm did not produce expected output for page ${page}`);
  const pngPath = join(cacheDir, match);
  const outBase = join(cacheDir, base);
  // One Tesseract pass emits both the plain text and a TSV with per-word confidence.
  execFileSync(TESSERACT_EXE, [pngPath, outBase, '-l', 'eng', 'txt', 'tsv'], {
    maxBuffer: 1024 * 1024 * 32,
  });
  const text = readFileSync(`${outBase}.txt`, 'utf8');
  const tsv = readFileSync(`${outBase}.tsv`, 'utf8');
  const confidence = meanWordConfidence(tsv);
  rmSync(pngPath, { force: true });
  rmSync(`${outBase}.txt`, { force: true });
  rmSync(`${outBase}.tsv`, { force: true });
  return { text, confidence };
}

/** Tesseract TSV: header + rows of level,page_num,block_num,par_num,line_num,word_num,left,top,width,height,conf,text. conf is -1 for non-word rows. */
function meanWordConfidence(tsv: string): number {
  const lines = tsv.trim().split('\n').slice(1);
  const confs: number[] = [];
  for (const line of lines) {
    const cols = line.split('\t');
    const conf = Number(cols[10]);
    if (Number.isFinite(conf) && conf >= 0) confs.push(conf);
  }
  if (confs.length === 0) return 0;
  return confs.reduce((a, b) => a + b, 0) / confs.length / 100;
}

function processBook(book: BookMeta) {
  const pdfPath = join(SOURCES_DIR, book.file);
  if (!existsSync(pdfPath)) {
    console.error(`SKIP ${book.slug}: source file not found at ${pdfPath}`);
    return;
  }
  const bookOutDir = join(PROCESSED_DIR, book.slug);
  const bookCacheDir = join(CACHE_DIR, book.slug);
  mkdirSync(bookOutDir, { recursive: true });
  mkdirSync(bookCacheDir, { recursive: true });

  let digitalCount = 0;
  let ocrCount = 0;
  let skippedCount = 0;
  const ocrConfidences: number[] = [];
  const skippedPages: number[] = [];
  const startedAt = Date.now();

  for (let page = 1; page <= book.pages; page += 1) {
    const padded = String(page).padStart(4, '0');
    const outPath = join(bookOutDir, `page-${padded}.txt`);
    const metaPath = join(bookOutDir, `page-${padded}.meta.json`);
    if (existsSync(outPath) && existsSync(metaPath)) {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as PageMeta;
      if (meta.source === 'digital') digitalCount += 1;
      else {
        ocrCount += 1;
        if (meta.ocrConfidence != null) ocrConfidences.push(meta.ocrConfidence);
      }
      if (meta.chars === 0) {
        skippedCount += 1;
        skippedPages.push(page);
      }
      continue; // resumable: already done
    }

    let text = '';
    let source: PageSource = 'digital';
    let ocrConfidence: number | null = null;
    if (book.extractionStrategy === 'text') {
      text = extractDigitalText(pdfPath, page);
      if (nonWhitespaceLength(text) < book.textFallbackThreshold) {
        const ocrResult = ocrPage(pdfPath, page, bookCacheDir);
        text = ocrResult.text;
        ocrConfidence = ocrResult.confidence;
        source = 'ocr';
      }
    } else {
      const ocrResult = ocrPage(pdfPath, page, bookCacheDir);
      text = ocrResult.text;
      ocrConfidence = ocrResult.confidence;
      source = 'ocr';
    }

    const chars = nonWhitespaceLength(text);
    // Digital text is trusted outright; OCR text is trusted in proportion to Tesseract's own confidence.
    const extractionConfidence = source === 'digital' ? 1 : (ocrConfidence ?? 0);

    const meta: PageMeta = {
      book: book.slug,
      page,
      source,
      chars,
      ocrConfidence,
      extractionConfidence,
      extractedAt: new Date().toISOString(),
    };
    writeFileSync(outPath, text, 'utf8');
    writeFileSync(metaPath, JSON.stringify(meta), 'utf8');

    if (source === 'digital') digitalCount += 1;
    else {
      ocrCount += 1;
      if (ocrConfidence != null) ocrConfidences.push(ocrConfidence);
    }
    if (chars === 0) {
      skippedCount += 1;
      skippedPages.push(page);
    }

    if (page % 25 === 0 || page === book.pages) {
      const elapsedS = Math.round((Date.now() - startedAt) / 1000);
      console.log(
        `[${book.slug}] ${page}/${book.pages} pages (digital=${digitalCount} ocr=${ocrCount} skipped=${skippedCount}) — ${elapsedS}s elapsed`,
      );
    }
  }

  rmSync(bookCacheDir, { recursive: true, force: true });

  const avgOcrConfidence =
    ocrConfidences.length > 0 ? ocrConfidences.reduce((a, b) => a + b, 0) / ocrConfidences.length : null;

  const manifest = {
    slug: book.slug,
    code: book.code,
    title: book.title,
    sourceFile: book.file,
    totalPages: book.pages,
    digitalPages: digitalCount,
    ocrPages: ocrCount,
    skippedPages,
    avgOcrConfidence,
    extractedAt: new Date().toISOString(),
  };
  writeFileSync(join(bookOutDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, `${book.slug}.extraction.json`), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(
    `DONE ${book.slug}: ${digitalCount} digital + ${ocrCount} OCR (avg conf ${avgOcrConfidence?.toFixed(2) ?? 'n/a'}) + ${skippedCount} skipped = ${book.pages} pages`,
  );
}

function main() {
  mkdirSync(PROCESSED_DIR, { recursive: true });
  mkdirSync(CACHE_DIR, { recursive: true });
  const only = process.argv[2];
  for (const book of loadBookRegistry()) {
    if (only && book.slug !== only) continue;
    console.log(`\n=== Extracting ${book.slug} (${book.extractionStrategy}) ===`);
    processBook(book);
  }
}

main();
