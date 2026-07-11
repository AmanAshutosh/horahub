# Folder structure

```
src/
  app/                 Next.js routes (App Router) + API handlers
    api/chart/         POST generate, GET /[id]
    api/geocode/       GET place search
    report/[id]/       report page (client)
    page.tsx           birth form page
  components/
    BirthForm/         feature: form, place search, types, validation
    report/            report view + sections (nav, charts, planets, daśā)
    ui/                reusable primitives (Field, Accordion, Cite, Spinner)
  ephemeris/           CALCULATION — Schlyter/Swiss positions, ayanāṁśa, daśā (+ Pratyantardaśā
                       tree), ascendant, divisional charts (varga.ts), retrograde, Shadbala
                       (partial — see shadbala.ts doc comment for scope). chart.ts exposes
                       Ephemeris + ChartFacts builder.
  interpret/           INTERPRETATION (legacy) — pure (ChartFacts, KB) → ReadingSection[]
  inference/           deterministic KB rule-matching engine (~17k rules), confidence scoring,
                       conflict resolution, yoga/dosha detection, dasha timeline, remedies
  narrative/           NARRATIVE ENGINE (in progress, Phase B) — projects inference/ output
                       into structured, non-prose Observations for an LLM writing layer
                       (not yet built). See NARRATIVE_ENGINE_HANDOFF.md at repo root.
  kb/                  small hand-authored knowledge base: rules/*.json + loader (distinct
                       from the large root-level kb/ pipeline that inference/ reads from)
  server/
    controllers/       HTTP concerns only
    services/          business orchestration
    repositories/      data access (the only place Prisma is queried)
    validators/        Zod schemas
    middlewares/       api-handler wrapper (errors, logging)
  lib/                 prisma, cache, ratelimit, timezone, geocoding, hash, logger, errors
  store/               Zustand client state
  hooks/               useDebounce, useGeocode
  types/               ChartFacts, ReadingSection, API contracts
  constants/           rāśi, nakṣatra, sign lords, chart layout
  config/              validated env + app constants

prisma/                schema.prisma + seed.ts
scripts/               build-kb.ts (KB validation)
tests/                 vitest: ephemeris, daśā, timezone, validation, interpret
docs/                  this documentation
kb/sources/            (git-ignored) raw books — never committed
```
