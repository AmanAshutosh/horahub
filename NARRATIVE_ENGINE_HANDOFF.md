# Narrative Engine — handoff note

Session paused here at the user's request. Working directory is left as-is —
**no git commands were run** (no add/commit/push). Everything below is
uncommitted on disk.

Full plan (all phases, all decisions) lives at:
`C:\Users\ASUS\.claude\plans\effervescent-marinating-hellman.md`

## What is completed (Phase A — all of it, plus Phase B1)

Every item below has passing tests (`npm run typecheck` and `npx vitest run`
are both clean — 124 tests passing — and `npm run build` succeeds end to end
including the Next.js production build).

- **A2 — Divisional charts**: `src/ephemeris/varga.ts` (new). D2, D3, D4, D7,
  D9 (upgraded from sign-only to a full chart), D10, D12 — each with its
  correct classical starting-sign rule (not a shortcut formula). Wired into
  `ChartFacts.divisionalCharts` and rendered in
  `src/components/report/sections/DivisionalChartsSection.tsx`.
- **A3 — Full dasha tree**: `src/ephemeris/dasha.ts` rewritten to build a full
  3-level tree (Mahadasha → Antardasha → **Pratyantardasha**, all periods —
  not just the current one). Legacy flat fields (`periods`, `antardashas`,
  `currentMahaIndex`, `currentAntarIndex`) are preserved byte-for-byte for
  backward compatibility; new fields are `ChartFacts.dasha.tree` and
  `.currentPath`.
- **A4 — Dosha detectors**: `src/inference/dosha-detector.ts` (new). Mangal
  Dosha (Lagna + Moon based, with cancellation logic) and Kaal Sarp Dosha
  (full + partial, 12 named sub-variants). Wired into
  `InferenceResult.doshas`.
- **A5 — Retrograde + migrate-on-read**: `src/ephemeris/retrograde.ts` (new),
  wired into both `AnalyticEphemeris` and `SwissEphemeris`.
  `chart.service.ts` now recomputes stale cached `ChartFacts` from the linked
  `Profile`'s birth data on read (`ensureFreshFacts`), rather than serving
  permanently-stale shapes forever. `ChartFacts.factsVersion` (currently `5`
  — see `FACTS_VERSION` in `src/ephemeris/assemble.ts`) drives this.
- **A1 — Shadbala (partial)**: `src/ephemeris/shadbala.ts` (new). Deliberately
  scoped — read the module doc comment before touching this file, it
  explains exactly which of the six classical limbs are implemented and
  which are skipped (and why: missing friend/enemy tables, missing
  sunrise/declination data). Wired as `ChartFacts.shadbala` and used as a
  tiebreaker in `src/inference/condition-checker.ts`'s `house-lord-strength`
  case when dignity alone is neutral.
- **B1 — Observation compiler**: `src/narrative/` (new directory).
  - `types.ts` — `Observation`, `Polarity`, `StrengthTier`.
  - `domain-map.ts` — the 17 user-facing life domains + the (partial) mapping
    from existing KB categories to them. **Known gap, documented in the file
    itself**: Parents, Children, Business, Property, Travel, Foreign
    Settlement, and Legal Matters have no KB category to map from — the
    underlying rule set was never tagged with those categories. Any brief
    built for those domains will have zero observations until a KB
    re-extraction pass happens (out of scope for this project).
  - `observation-compiler.ts` — `compileObservations(InferenceResult):
    Observation[]`. Pure projection (no new matching/scoring), tested in
    `src/narrative/__tests__/observation-compiler.test.ts` (11 tests).
  - `index.ts` — re-exports. Explicitly does NOT export a `buildReportBrief`
    or anything from B2/B3 because they don't exist yet.

## What is partially completed

Nothing is left half-written — B1 is complete and self-contained. What's
"partial" is Shadbala (A1), by design (see its module doc). Everything else
listed above is fully finished for its stated scope.

## What remains for the next session

In plan order (see the full plan file for exact type shapes and reasoning):

1. **A2 follow-up** (optional, not blocking): D16/D20/D24/D27/D30/D60. D30
   and D60 specifically need reference-chart verification before they're
   trustworthy — don't skip that step when picking this up.
2. **B2 — Merge/prioritization** (`src/narrative/merge.ts`, not started):
   group `Observation[]` by domain, apply the fixed strength order (Natal >
   Mahadasha > Antardasha > Transit > Minor Yogas), and combine
   same-topic conflicting-polarity observations into one `MergedObservation`
   (primary + retained nuance) rather than presenting contradictions
   side-by-side. Topic-clustering approach not yet decided in code — the
   plan suggests grouping by `domain + effectDomain` when available,
   falling back to no-merge (1:1) when `effectDomain` is null, to avoid
   over-aggressive false-merging.
3. **B3 — Report brief assembly** (`src/narrative/report-brief.ts`, not
   started): assemble the final `ReportBrief` (17 `LifeDomainBrief`s +
   `MahadashaBrief`/`AntardashaBrief` walking `ChartFacts.dasha.tree` +
   remedies + `overallDirection`). Needs to reuse `remedy-engine.ts`'s
   `buildDomainRemedyCards` and `timeline.ts`'s `buildTimeline` (extended to
   walk the new dasha tree for antardasha-level timing — that extension
   hasn't been made yet either).
4. **Phase C — LLM client + prompts** (`src/llm/`, not started). User has
   pre-approved building this without a live API key (mocked/testable),
   wiring `ANTHROPIC_API_KEY` later. Needs `@anthropic-ai/sdk` added to
   `package.json` (not yet added).
5. **Phase D — Persistence + API + frontend** (not started). User has
   pre-approved writing the Prisma schema + migration file for review, but
   **not** running it against the database. New models: `ReportBrief`,
   `NarrativeReport` (exact shape in the plan file). New service
   `narrative.service.ts`, new routes
   `POST/GET /api/chart/[id]/narrative`. Retirement of `src/interpret/` and
   `src/lib/interpreter/LifeDomainInterpreter.ts` is part of this phase, not
   before.

## Assumptions and known limitations (read before continuing)

- **Shadbala is intentionally partial.** `totalRupas` is NOT comparable to
  classical absolute minimum-required-rupas thresholds — only used as a
  *relative* signal between planets in the same chart
  (`isRelativelyStrong()`). Don't let a future prompt/report imply it's a
  full classical calculation.
- **Varga coverage is D2/D3/D4/D7/D9/D10/D12 only.** Any code assuming
  D16–D60 exist will silently get `undefined` from
  `ChartFacts.divisionalCharts` — the field is optional and keyed only by
  the divisions above.
- **`retrograde` and `shadbala` are optional fields** on `ChartFacts` /
  `PlanetPlacement` specifically so old cached chart rows (pre-migration)
  don't break at runtime. Any new code reading them must handle `undefined`.
- **`Observation.claim` is a short deterministic template label, not final
  prose.** It exists so the (not-yet-built) LLM layer has something concise
  to ground on — it is not meant to be shown to end users directly.
- **7 of the 17 life domains have no KB coverage** (see domain-map.ts).
  B3 must render "insufficient data" for those, not fabricate content to
  fill the gap.
- The `matchedRuleCount` in the KB graph grew from 2823 to 2880 rules
  between builds during this session (visible in `npm run build` output) —
  this was NOT caused by any change in this session (no KB source files
  were touched); it's from the pre-existing `kg:build` step re-running
  against `kb/rules/*.jsonl` on disk. Not a regression, just noting it in
  case it's surprising later.

## Verification commands (all currently green)

```
npm run typecheck   # clean
npx vitest run      # 124 passed
npm run build       # prisma generate + kg:build + next build, all succeed
```
