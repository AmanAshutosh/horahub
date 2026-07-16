# HoraHub

Open-source Vedic astrology engine. Enter birth details, get a computed
nine-graha chart with **sourced, citation-backed** interpretation — and
deliberately **no fabricated confidence scores**.

Two principles hold the project together:

1. **Astronomy is separate from the books.** Planetary longitudes, ascendant,
   nakṣatra and daśā come from an ephemeris. The texts only interpret an
   already-computed chart. The seam between them is the `ChartFacts` type.
2. **Interpretation cites sources in original wording.** Rules in `kb/` are
   HoraHub's own encoding of classical principles, each carrying a citation.
   Copyrighted translations are never redistributed (see `NOTICE`).

## Stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind · Prisma + PostgreSQL ·
Zustand · Zod · Vitest · optional Upstash Redis (cache + rate limit).

## Quick start

```bash
git clone <your-fork> horahub && cd horahub
npm install                      # also runs prisma generate
cp .env.example .env             # fill DATABASE_URL (see docs/INSTALLATION.md)
npm run db: migrate               # create tables
npm run db:seed                  # load the kb-v1 knowledge base
npm run dev                      # http://localhost:3000
```

No database yet? You can still run the engine and tests offline:

```bash
npm test                         # 17 tests: ephemeris, daśā, timezone, validation, interpret
```

## How a report is produced

```
birth form ──► /api/chart ──► chartService
                                 │
       localToUtc (IANA DST) ────┤  resolve wall-clock → UTC instant
       ephemeris.compute() ──────┤  → ChartFacts (cached by birthHash)
       interpret(facts, kb) ─────┘  → ReadingSection[] (versioned by KB)
                                 │
                          persist + render ──► /report/[id]
```

- **Location**: you type a village/town/district; `/api/geocode` resolves it to
  coordinates + IANA timezone via Open-Meteo (no key). No coordinates by hand.
- **Determinism**: identical births hit the cache / database, never recompute.
- **Versioning**: every reading records its `kbVersion`, so re-indexing the
  knowledge base never silently rewrites an existing report.

## Scripts

| Command | Purpose |
|---|---|


| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed the knowledge base |
| `npm run kb:build` | Validate KB rule files |



## Documentation

- [`docs/INSTALLATION.md`](docs/INSTALLATION.md) — accounts, env, first run
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — local workflow
- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) — what lives where
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layers and the `ChartFacts` seam
- [`docs/API.md`](docs/API.md) — endpoints, payloads, status codes
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema, indexes, migrations, backups
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — zero-DevOps deploy (Vercel + Neon + Upstash)
- [`docs/KB_PIPELINE.md`](docs/KB_PIPELINE.md) — adding books without shipping copyrighted text
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — conventions, the source-text rule
- [`BUILD_STATUS.md`](BUILD_STATUS.md) — what is complete vs. the next batches

## A word on what this is

Astrology has no demonstrated predictive validity. HoraHub presents *what the
classical texts say* about a computed chart, with citations — not forecasts of
your life, and never a percentage on your health or finances. It is not a
substitute for medical, legal, or financial advice.

## License

Code: MIT (`LICENSE`). Encoded KB rules: CC-BY-SA. Underlying source books remain
the property of their authors/publishers and are not redistributed (`NOTICE`).
