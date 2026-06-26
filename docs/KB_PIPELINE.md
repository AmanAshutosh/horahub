# Knowledge-base pipeline

The KB is **data**, built offline and versioned. Adding a book never requires a
code change, and **no copyrighted source text ever enters the repository**.

```
PDF ─► [1 extract] ─► [2 normalize] ─► [3 segment] ─► [4 ENCODE] ─► [5 review] ─► [6 publish]
        OCR if         fix OCR          chapter/        in YOUR        human         versioned
        scanned        garble           verse units     words          verify        kb-vN
```

1. **Extract** — text PDFs: `pdftotext -layout`. Scanned: `ocrmypdf --deskew`
   then extract; Devanagari needs Tesseract `san`+`eng` and hand-fixing.
2. **Normalize** — repair OCR breaks/garble. Keep the raw extract alongside.
3. **Segment** — split into `{ book, chapter, verse_range, raw_text }`.
4. **Encode** — write each rule as structured JSON in **original wording** with a
   citation (`sourceWork`, `sourceRef`). The public-domain Sanskrit verse may be
   attached; the copyrighted English translation may not.
5. **Review** — nothing is served unverified (admin review queue — roadmap).
6. **Publish** — tag `kb-vN`; reports record the version they used.

## The repository rule
- `kb/rules/*.json` and `kb/verses-sanskrit/` → **committed** (your original work
  + public-domain text).
- `kb/sources/` (raw PDFs, OCR dumps, copyrighted translations) → **git-ignored**,
  local only. Confirm with `git status` before any public push.

## Validate
```bash
npm run kb:build      # checks counts + that every rule carries a citation
```
