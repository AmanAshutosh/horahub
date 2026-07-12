# Narrative Engine — status: all planned phases complete

All phases (A, B, C, D) from the plan are implemented, tested, and verified.
**No git commands were run in this session** — nothing was committed or
pushed. Everything below is on disk for review. `git status` shows the
earlier Phase A/B1 work already committed (presumably by you between
sessions) and this session's work (B2 through D4) as modified/untracked.

Full plan: `C:\Users\ASUS\.claude\plans\effervescent-marinating-hellman.md`

## Verification (all green as of this session)

```
npm run typecheck   # clean
npx vitest run      # 166 passed, 23 test files
npm run build       # prisma generate + kg:build + next build — all succeed
```

Also manually verified:
- Homepage and existing chart-generation API flow still work (confirmed via
  the dev server — chart generation itself failed only because this sandbox
  can't reach the live Neon DB over the network; that's an environment
  restriction, not a code defect).
- `NarrativeSection.tsx` server-renders correctly in all four states (idle /
  generating / failed / complete) with the expected text content, checked
  via `renderToStaticMarkup` against real prop shapes.
- Full production build (`next build`) succeeds, including the new
  `/api/chart/[id]/narrative` route — this also confirms no `server-only`
  code leaked into the client bundle.

**Not done**: a real, visual, in-browser check (no `chromium-cli` available
in this Windows sandbox), and no live LLM call was ever made (no
`ANTHROPIC_API_KEY` configured — by design, per your earlier instruction).

## What was built this session (Phase B2 onward — Phase A and B1 were already done)

- **B2 — Merge/prioritization** (`src/narrative/merge.ts`): groups
  `Observation[]` by `topicKey` (a new field added to `Observation` in B1's
  type, additive/non-breaking), applies the fixed strength order (Natal >
  Mahadasha > Antardasha > Transit > Minor Yogas), and produces
  `MergedObservation[]` — a primary claim per topic, with same-topic
  opposite-polarity claims kept as `nuance` (never discarded) and
  same-polarity claims kept as `corroboration`.
- **B3 — Report brief** (`src/narrative/report-brief.ts`):
  `buildReportBrief(facts): ReportBrief | null`. Produces all 17
  `LifeDomainBrief`s (7 of which will always be empty — see "known
  limitations" below), a windowed `MahadashaBrief[]` (3 before / 4 after
  current, each with all 9 `AntardashaBrief`s), and a cross-domain
  `overallDirection`. Integration-tested against the real KB graph and a
  real computed chart (`src/narrative/__tests__/report-brief.test.ts`).
- **C1 — LLM client** (`src/llm/client.ts`, `src/llm/providers/anthropic.ts`,
  `src/llm/index.ts`): provider-agnostic `LlmClient` interface, Anthropic
  adapter (SDK added to `package.json`, lazily imported), provider selection
  via `env.LLM_PROVIDER`/`ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` (added to
  `src/config/env.ts`, following the exact pattern already used for
  `EPHEMERIS_PROVIDER`).
- **C2 — Prompts** (`src/llm/prompts/`): `narrative-system.ts` (the
  persona/voice/style system prompt, codified from your original spec),
  `life-domain.ts`, `dasha-breakdown.ts`, `overview.ts` — all pure,
  auditable string builders over `ReportBrief` data only (never raw
  `ChartFacts`). Each returns `null` when there's no data for that
  section, so the orchestrator never spends a call writing about nothing.
- **C3 — Orchestration** (`src/llm/generate-report.ts`,
  `src/llm/concurrency.ts`): `generateNarrativeReport(brief)` runs the full
  call plan (1 overview + up to 17 domain + up to ~7 mahadasha + up to ~63
  antardasha calls) with bounded concurrency (default 5). Mahadasha calls
  complete before antardasha calls start, so each antardasha prompt can
  reference its parent's already-generated text.
- **D1 — Persistence schema**: `ReportBrief` and `NarrativeReport` Prisma
  models added to `prisma/schema.prisma`. **The live database was never
  touched** — `prisma migrate dev` was not run (it would have connected to
  your real Neon DB). Instead: `prisma validate` and `prisma generate` were
  run (both local-only, no DB connection) to confirm the schema is correct
  and to regenerate the TS client, and the migration SQL was
  **hand-authored** at
  `prisma/migrations/20260712203000_add_report_brief_narrative_report/migration.sql`
  to match Prisma's exact conventions (verified against the existing `init`
  migration's format). **You still need to actually run this migration
  against your database** before the narrative endpoints will work.
- **D2 — Repository/service/controller/routes**: `chart.repository.ts`
  gained `createReportBrief`/`findReportBrief`/`createNarrativeReport`/
  `findLatestNarrativeReport`. New `narrative.service.ts` orchestrates
  brief → LLM → persist (kept separate from `chart.service.ts` — very
  different latency profile). New `narrative.controller.ts` and routes:
  `POST /api/chart/[id]/narrative` (kicks off generation) and
  `GET /api/chart/[id]/narrative` (latest complete report or 404).
- **D3 — Legacy retirement**: **deliberately NOT deleted** — see "judgment
  call" below.
- **D4 — Frontend**: `src/components/report/NarrativeSection.tsx` (new) —
  renders a prominent "Your Personalized Reading" block right after the "At
  a Glance" section, with idle/generating/failed/complete states. Wired
  through `src/app/report/[id]/page.tsx` (fetches existing report, checks
  for/generates narrative report) and `ReportView.tsx`. New CSS in
  `src/styles/components/report.css` (`.narrative-*` classes, matching the
  existing `.dasha-callout-*` design tokens). New response types in
  `src/types/api.ts` (`NarrativeReportResponse`, deliberately NOT importing
  from `src/llm/*` since that chain has `server-only` — the shape is
  duplicated to keep client bundles clean).

## Judgment call: Phase D3 (legacy retirement) — deviated from the plan's literal wording

The plan said "delete `LifeDomainInterpreter.ts` once its one caller is
repointed" and "stop calling `interpret()` once the frontend renders
`NarrativeReport` instead." I did **not** do either, and did **not** delete
anything — I only added deprecation-notice doc comments to both
`src/interpret/index.ts` and `src/lib/interpreter/LifeDomainInterpreter.ts`.

Why: this session's D4 frontend work added the Narrative Engine's prose as
a new, prominent block — it did **not** replace the existing 20-section
report's per-life-area sections (career/finance/marriage/etc., sections
1-9), which still get their content from `report-builder.ts`'s
`buildLifeAreaSection()`, which still calls `interpretDomain()` from
`LifeDomainInterpreter.ts`. Similarly, `ReportView.tsx`'s Planets/Houses
grids still read `reading` from `interpret()` directly — the Narrative
Engine produces prose, not tabular grid data, so it doesn't replace that
either. Deleting or unwiring either legacy path right now would have
**broken currently-working, currently-valuable parts of the live report**,
not cleaned up dead code. If you want a full replacement (LLM prose
replacing the citation-dump life-area sections too), that's follow-on work,
not something to force through as a "finish everything" checkbox.

## Known limitations (read before extending this further)

- **7 of 17 life domains always have zero data**: Parents, Children,
  Business, Property, Travel, Foreign Settlement, Legal Matters. The
  underlying ~17k-rule KB was never tagged with those categories (see
  `src/narrative/domain-map.ts`'s doc comment). `LifeDomainBrief.hasData`
  is `false` for these, and the prompt builders return `null` for them —
  no LLM call is wasted, no content is fabricated.
- **Shadbala is a documented partial implementation** (Phase A, unchanged
  this session) — see `src/ephemeris/shadbala.ts`'s module doc. Don't treat
  `totalRupas` as a classical absolute value.
- **Varga coverage is D2/D3/D4/D7/D9/D10/D12 only** — D16/D20/D24/D27/D30/D60
  were explicitly deferred in Phase A and still are.
- **NarrativeReport generation is fully synchronous** (v1) — the POST
  request awaits the entire call plan (potentially dozens of LLM calls,
  possibly minutes). `NarrativeReport.status` (`generating`/`complete`/
  `failed`) exists in the schema to support a future background-job version
  without another migration, but building that job queue was explicitly
  out of scope for this project and still is.
- **The live database has NOT been migrated.** `ReportBrief` and
  `NarrativeReport` tables do not exist yet in your actual Postgres
  instance. Calling `POST /api/chart/[id]/narrative` against a live
  deployment right now will fail with a "relation does not exist" error
  until you run the migration.
- **No `ANTHROPIC_API_KEY` is configured** — set it in `.env.local`
  (`ANTHROPIC_API_KEY=...`) before the narrative endpoints can actually
  call the LLM. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5` if unset.
- **No live end-to-end test was possible this session** — this sandbox
  cannot reach your Neon database over the network, so I could not generate
  a real chart, run a real narrative generation, or read the LLM's actual
  prose output. Everything was verified with unit/integration tests against
  the real KB graph and real computed charts, plus a static render check of
  the new UI component — but nobody has yet read what Claude actually
  writes for a real chart. Do that before shipping.

## Suggested next steps, in order

1. Run the migration against your actual database:
   `npm run db:migrate` (or your normal deploy flow) — review
   `prisma/migrations/20260712203000_add_report_brief_narrative_report/migration.sql`
   first.
2. Add `ANTHROPIC_API_KEY` to `.env.local`.
3. Generate a real chart, click "Generate my personalized report," and
   actually read the output — check it against the writing-style spec
   (simple English, no jargon, no contradictions, warm mentor voice).
4. Tune `src/llm/prompts/*` based on what you read in step 3 — bump
   `PROMPT_VERSION` in `src/llm/prompts/narrative-system.ts` when you do,
   so old cached `NarrativeReport` rows aren't silently treated as current.
5. Decide whether/how to eventually retire `src/interpret/` and
   `LifeDomainInterpreter.ts` for real — that means either extending the
   Narrative Engine to replace the tabular grids and per-life-area citation
   sections, or deciding to keep both systems permanently (prose + raw
   citations as two different views).
