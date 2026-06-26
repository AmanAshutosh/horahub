# Contributing

Thanks for helping build an honest Jyotiṣa engine.

## Non-negotiables
1. **Never commit copyrighted source text.** Books live in the git-ignored
   `kb/sources/`. KB rules must be your own wording with a citation. Run
   `git status` before pushing.
2. **No fabricated confidence.** Interpretation output must not contain
   confidence percentages on a person's life, health, or finances. A test
   enforces this.
3. **Respect the layers.** Calculation in `ephemeris/`, interpretation in
   `interpret/` (pure), HTTP in `server/`. No SQL outside repositories.

## Workflow
- Branch from `main`: `feat/...`, `fix/...`, `docs/...`.
- `npm run typecheck && npm test && npm run lint` must pass.
- Open a PR; Vercel builds a preview. Keep PRs focused.

## Commit style
Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

## Adding interpretation
Add a rule to `src/kb/rules/*.json` with `ruleKey`, the condition, the `reading`
(your words), and a `source` block. Then surface it in `src/interpret/`.
