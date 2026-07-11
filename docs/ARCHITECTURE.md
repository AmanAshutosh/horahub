# Architecture

## Dependency direction

```
┌──────────────────────────────────────────────────────────────┐
│  app/ + components/      UI, report rendering, birth form       │  presentation
├──────────────────────────────────────────────────────────────┤
│  server/                 controllers → services → repositories  │  application
│    validators/ middlewares/                                     │
├──────────────────────────────────────────────────────────────┤
│  interpret/              pure: (ChartFacts, KB) → Reading        │  interpretation
├──────────────────────────────────────────────────────────────┤
│  ephemeris/              birth → ChartFacts (Schlyter + daśā)    │  calculation
├──────────────────────────────────────────────────────────────┤
│  kb/                     versioned rules + citations (data)      │  data
└──────────────────────────────────────────────────────────────┘
   lib/ (prisma, cache, ratelimit, timezone, geocoding, hash, logger, errors)
```

Each layer depends only on those below it. UI never imports a repository;
a controller never computes a chart; the interpreter never touches I/O.

## The `ChartFacts` seam

`ephemeris/chart.ts` defines an `Ephemeris` interface returning `ChartFacts`
(`src/types/chart.ts`). The shipped `AnalyticEphemeris` computes positions with
Schlyter orbital-element methods (~arc-minute accuracy — enough to fix nakṣatra
and daśā in nearly all cases).

Arc-second precision is already implemented: `SwissEphemeris` (`swiss.ts`) wraps
the Swiss Ephemeris (`sweph`, built-in Moshier model — no data files) and feeds
the **same** `assembleChartFacts`. `provider.ts` selects between them by
configuration; **nothing above the seam changes**, because everything downstream
consumes only `ChartFacts`.

```ts
// provider.ts — switched by EPHEMERIS_PROVIDER ("analytic" | "swiss")
export const ephemeris: Ephemeris =
  env.EPHEMERIS_PROVIDER === 'swiss' ? swissEphemeris : analyticEphemeris;
```

Both providers are tested to agree on every graha within 1.5°, with identical
Sun/Moon/Lagna signs and Moon nakṣatra (`tests/swiss-vs-analytic.test.ts`).

## Why interpretation is pure

`interpret(facts, kb)` has no database, no network, and no randomness. Given the
same chart and KB version it always yields the same reading. That makes it:

- **Testable** — `tests/interpret.test.ts` asserts structure, citations, and the
  absence of any confidence score.
- **Cacheable** — readings are stored per `(chartId, kbVersion)`.
- **Auditable** — every item links back to a source citation.

## Determinism & caching

A chart is a pure function of birth data. `birthHash` (sha-256 of normalized
inputs) is the cache key and the `Chart.inputHash` unique column, so an identical
birth is served from Redis or Postgres and never recomputed. Readings are keyed
by KB version, so re-indexing the knowledge base produces a *new* reading rather
than mutating an existing one.

## Narrative Engine (in progress)

A second, richer interpretation path exists alongside `interpret/`:

```
ephemeris/ (ChartFacts, now incl. divisionalCharts/shadbala/dasha.tree)
   → inference/        deterministic KB rule-matching, confidence scoring,
                        conflict resolution, yoga/dosha detection, timeline
   → narrative/         (NEW, Phase B — partially built)
                        projects InferenceResult into structured, non-prose
                        Observations, to eventually feed an LLM writing layer
   → llm/                (NOT YET BUILT — Phase C)
                        will turn narrative/'s structured output into prose
```

`src/inference/*` was already fully built (KB rule-matching over ~17k
classical-text rules, yoga/dosha detection, dasha timeline, remedy
extraction) but its output was never persisted or run through an LLM —
`generateReportSections()` renders it as verbatim-citation report sections
today. `src/narrative/*` is a new layer on top of it, being built to
eventually replace both `interpret/` and the citation-dump rendering with
LLM-written prose grounded in deterministic chart reasoning.

**Current status**: only `src/narrative/observation-compiler.ts` (Phase B1)
exists — it projects an `InferenceResult` into `Observation[]`. Nothing
consumes it yet. See `NARRATIVE_ENGINE_HANDOFF.md` at the repo root for the
full plan, what's done, and what's next.

## Request lifecycle (POST /api/chart)

```
route → withApi (error/log wrapper)
      → chartController (parse, validate, rate-limit)
      → chartService (localToUtc → ephemeris.compute [cache/db] → interpret → persist)
      → chartRepository (Prisma)
```
