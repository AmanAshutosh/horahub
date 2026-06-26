# Development

## Daily loop
```bash
npm run dev          # hot-reloading app
npm run test:watch   # tests in watch mode
npm run typecheck    # strict tsc
npm run format       # prettier
```

## Where to make changes
- **New astronomical output** → `src/ephemeris/` only. Extend `ChartFacts` in
  `src/types/chart.ts`; nothing else needs to know how the number was produced.
- **New interpretation** → add a rule to `src/kb/rules/*.json` (own wording +
  citation), then consume it in `src/interpret/`. Keep `interpret()` pure.
- **New endpoint** → validator → controller → service → repository. Never call
  the database outside a repository; never put business logic in a controller.
- **New UI** → a folder under `src/components/` with the component, its types,
  and an `index.ts`. Reuse primitives in `src/components/ui/`.

## Conventions
- TypeScript strict, `noUncheckedIndexedAccess` on. Prefer `type` imports.
- No fabricated confidence scores anywhere in interpretation output (there's a
  test enforcing this — `tests/interpret.test.ts`).
- Tailwind design tokens live in `tailwind.config.ts`; use them, avoid inline styles.
