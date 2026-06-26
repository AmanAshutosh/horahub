# Database

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`.

## Models
- **User** — accounts (email unique, role USER/ADMIN). Indexed on email.
- **Profile** — saved birth profiles per user. Indexed on userId.
- **Chart** — computed chart. `inputHash` is unique → identical births are a
  single row (cache key). `facts` holds serialized `ChartFacts`.
- **Reading** — interpretation for a chart at a specific `kbVersion`.
  Unique on `(chartId, kbVersion)` so re-indexing never duplicates or mutates.
- **KbVersion / KbRule** — published, immutable snapshots of the knowledge base;
  rules carry `sourceWork` + `sourceRef` citations and original `reading` prose.

## Migrations
```bash
npm run db:migrate            # dev: create + apply a migration
npm run db:deploy             # prod: apply committed migrations
```
Migrations are generated into `prisma/migrations/` and committed. Use `DIRECT_URL`
for migrations when your provider pools connections (e.g. Neon).

## Seeding
```bash
npm run db:seed               # loads kb-v1 from src/kb/rules/*.json
```

## Backups & restore
- **Neon**: automatic point-in-time history; restore via a branch at a timestamp.
- **Portable dump**:
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f horahub-$(date +%F).dump   # backup
  pg_restore -d "$DATABASE_URL" --clean horahub-YYYY-MM-DD.dump  # restore
  ```
Add a nightly `pg_dump` as a scheduled job and verify a test restore periodically.
