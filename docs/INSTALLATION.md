# Installation

## Prerequisites
- Node.js 18.18+ (20 LTS recommended)
- A PostgreSQL database (local, or Neon — see DEPLOYMENT.md)
- (Optional) An Upstash Redis database for caching + rate limiting

## Steps
1. Install dependencies — this also runs `prisma generate`:
   ```bash
   npm install
   ```
2. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in at minimum `DATABASE_URL` (and `DIRECT_URL` if your provider gives a
   separate direct/migration URL, like Neon). Upstash and `AUTH_SECRET` are
   optional for local development.
3. Create the schema and seed the knowledge base:
   ```bash
   npm run db:migrate     # prisma migrate dev
   npm run db:seed        # loads kb-v1
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Verify without a database
The pure engine and the full test suite run with no database or network:
```bash
npm test
npm run typecheck
```

## Troubleshooting
- **`@prisma/client did not initialize`** — run `npm install` or `npx prisma generate`.
- **Env validation warning at boot** — `DATABASE_URL` is missing from `.env`.
- **Geocoding returns nothing in the browser** — the `/api/geocode` route needs
  outbound access to `geocoding-api.open-meteo.com`; check network/proxy.
