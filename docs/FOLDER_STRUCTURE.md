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
  ephemeris/           CALCULATION — Schlyter positions, ayanāṁśa, daśā, ascendant
                       chart.ts exposes Ephemeris + ChartFacts builder
  interpret/           INTERPRETATION — pure (ChartFacts, KB) → ReadingSection[]
  kb/                  knowledge base: rules/*.json (own wording) + loader
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
