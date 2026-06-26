# HoraHub — Architecture, Knowledge-Base Pipeline & Deployment Guide

> Open-source Vedic astrology engine. This document is the build spec and the
> ops manual. It assumes you can write Next.js/Prisma (you can) but explains
> DevOps from zero.

---

## 0. Reality check (read once, then never re-litigate)

**The five uploads are three sources.**

| File | What it is | State | Use |
|---|---|---|---|
| `Maharishi_..._BPHS_Vol_1.pdf` | BPHS, Santhanam translation | noisy OCR text | dedupe → drop (same as below) |
| `BPHS_-_1_RSanthanam.pdf` | BPHS, Santhanam translation | noisy OCR text | **primary BPHS source** |
| `Robert_Svoboda_-_Light_on_life.pdf` | Svoboda, *Light on Life* | clean text, **in-print, copyrighted** | learn-from, don't redistribute |
| `1709551892.pdf` | unknown | scanned image, needs OCR | identify before use |
| `3_book.pdf` | unknown | scanned image, needs OCR | identify before use |

**Two hard separations that keep this project honest and legal:**

1. **Astronomy ≠ books.** Planet longitudes, ascendant, dashas come from an
   *ephemeris* (Swiss Ephemeris). The books only interpret an already-computed
   chart. Never let "interpretation" leak into "calculation."
2. **Public-domain verse ≠ copyrighted translation.** The original Sanskrit BPHS
   is ancient and free. Santhanam's *English translation* and Svoboda's book are
   copyrighted. The repo ships **your rule-encodings in your own words** + cited
   references; it does **not** ship the books or their extracted full text.
   `/sources/` is git-ignored.

---

## 1. System architecture

Four layers, one direction of dependency (top depends on bottom, never reverse):

```
┌─────────────────────────────────────────────────────────┐
│  app/        Next.js 15 · React · TS · Tailwind · shadcn  │  presentation
│              dashboard, charts (Recharts), timeline       │
├─────────────────────────────────────────────────────────┤
│  interpret/  rules engine: (chart facts) → cited insights │  interpretation
│              pure functions, no I/O, fully unit-testable   │
├─────────────────────────────────────────────────────────┤
│  ephemeris/  Swiss Ephemeris wrapper                      │  calculation
│              birth data → planets, lagna, dashas, vargas   │  (deterministic)
├─────────────────────────────────────────────────────────┤
│  kb/         knowledge base: rules + citations (your data) │  data
│              built offline by the ingestion pipeline       │
└─────────────────────────────────────────────────────────┘
   PostgreSQL (Prisma)  ·  Redis (chart cache)  ·  Auth (saved charts)
```

Why this shape:
- **`ephemeris/` is the only place math lives.** Swap implementations (WASM
  swisseph in-process, or a tiny Python sidecar calling `pyswisseph`) without
  touching anything above.
- **`interpret/` is pure.** Input = chart facts JSON. Output = list of
  `{ statement, basis, citation, severity? }`. No database, no clock, no
  randomness → it's testable and reproducible, which is the whole point of an
  evidence-based engine.
- **`kb/` is data, not code.** New books re-index here without code changes.

### The chart-facts contract (the seam everything hangs on)

```ts
// ephemeris/ produces this; interpret/ consumes only this.
type ChartFacts = {
  ayanamsa: number;
  ascendant: { sign: number; degree: number };
  planets: Record<Planet, {
    sign: number; degree: number; house: number;
    nakshatra: number; pada: number;
    retrograde: boolean; combust: boolean;
    dignity: 'exalted'|'debilitated'|'own'|'friend'|'enemy'|'neutral';
  }>;
  vimshottari: DashaPeriod[];      // mahadasha → antardasha → pratyantar
  houses: Record<number, { sign: number; lord: Planet; occupants: Planet[] }>;
  // vargas computed on demand: D9 (navamsa), D10 (dashamsa), ...
};
```

You already have a working, honest **Vimshottari + nakshatra + lagna** engine
in `horahub-core.html` (analytic ephemeris, ~1–2 arcmin). Production swaps the
analytic moon-longitude for Swiss Ephemeris; the contract above stays identical.

---

## 2. Knowledge-base ingestion pipeline

This is the part the master prompt overweights ("read every rule perfectly").
The honest version is a **pipeline with a human-verification step**, run offline,
versioned. It is not a one-shot read, and accuracy of citations matters more than
coverage.

```
PDF ──► [1 extract] ──► [2 normalize] ──► [3 segment] ──► [4 ENCODE] ──► [5 review] ──► [6 publish]
         OCR if            fix OCR          chapter/         rules in        human          versioned
         scanned           garble           verse units      YOUR words      verify         kb/ release
```

**1. Extract**
- Text PDFs: `pdftotext -layout`.
- Scanned PDFs (`1709551892`, `3_book`): OCR. `ocrmypdf --rotate-pages --deskew
  in.pdf out.pdf` then extract. Sanskrit/Devanagari needs `tesseract` with `san`
  + `eng` traineddata; expect to hand-fix.

**2. Normalize** — the Santhanam OCR is genuinely dirty ("Saturuis a servant",
mangled Devanagari). A cleanup pass (regex + a small LLM clean step is fine here)
joins broken lines and fixes obvious OCR errors. Keep the raw extract too.

**3. Segment** — split into `{ book, chapter, verse_range, raw_text }` records.
BPHS has clear `Chapter N` + numbered-verse markers; use them.

**4. Encode (the legal + quality firewall)** — for each segmented rule, a human
(or LLM-assisted, human-approved) writes a **structured rule in original wording**:

```json
{
  "id": "bphs.dasha.saturn.7th",
  "conditions": { "dasha_lord": "Saturn", "lord_of_house": 7 },
  "themes": ["marriage", "delay"],
  "reading": "Saturn periods tied to the 7th tend to slow partnership timing.",
  "source": { "work": "BPHS", "ref": "dasha chapters", "tradition": "Parashari" },
  "confidence": null
}
```
Note: `reading` is **your prose**, not Santhanam's. `confidence` is `null` by
design — see §3. The public-domain *Sanskrit* verse may be attached; the
copyrighted *English translation* may not.

**5. Review** — encoded rules go through a review queue (admin UI). Nothing is
served to users unverified. This is your prompt's "version the KB / re-index"
requirement, made concrete.

**6. Publish** — tag a KB version (`kb-v1`, `kb-v2`). User reports record which
KB version produced them, so re-indexing never silently changes old readings.

**Repo data policy:** `kb/sources/` (raw PDFs, raw OCR, copyrighted full text) is
git-ignored. `kb/rules/` (your encoded JSON) and `kb/verses-sanskrit/`
(public-domain) are committed. This is the line that keeps the open-source repo
takedown-proof.

---

## 3. Why there is no "confidence %"

The master prompt asks for a confidence percentage on every prediction, including
health and finance. **Don't ship that.** Astrology has no measured predictive
validity (Carlson, *Nature* 1985, and replications: astrologers performed at
chance). A number like "82%" on "weak liver" or "invest in March" manufactures
certainty that doesn't exist and can push a user away from a doctor or into a bad
financial call. It also contradicts the project's own goal of traceability.

Ship instead: **"classical texts associate X with Y — here is the rule and its
source."** That's defensible, it's honest, and it's a better product. Health and
finance modules state classical *associations* and always defer to professionals.
This is a product-integrity line, not a style preference.

---

## 4. Repository structure & licensing

```
horahub/
├─ app/                  # Next.js routes, UI
├─ ephemeris/            # swisseph wrapper + dasha/varga math
├─ interpret/            # pure rules engine
├─ kb/
│  ├─ rules/             # ✅ committed — YOUR encoded rules (JSON)
│  ├─ verses-sanskrit/   # ✅ committed — public-domain source verses
│  └─ sources/           # ❌ .gitignored — raw PDFs/OCR/translations
├─ prisma/schema.prisma
├─ scripts/ingest/       # the §2 pipeline
├─ LICENSE               # MIT (code) — note KB data license separately
├─ NOTICE                # credits sources without redistributing them
└─ README.md
```

- **Code license:** MIT or AGPL-3.0 (AGPL if you want forks-as-services to stay
  open).
- **Data:** license your *encoded rules* CC-BY-SA; do **not** claim a license
  over the underlying books.
- **NOTICE** file: credit Santhanam, Svoboda, Parashara — attribution is correct
  and costs nothing; it is not the same as redistribution.

---

## 5. Build phases (realistic)

This is weeks of work, not one session. Order by dependency:

- **P0 — Engine spine.** Swiss Ephemeris wrapper → `ChartFacts`. Port your
  working Vimshottari/nakshatra/lagna logic. Golden-file tests against 10 known
  charts. *Everything downstream is worthless if this is wrong, so it goes first.*
- **P1 — KB v1.** Run §2 pipeline on BPHS only. ~50 well-verified rules beats
  5,000 noisy ones. Ship `kb-v1`.
- **P2 — Interpretation + dashboard.** `interpret/` over `ChartFacts` + `kb-v1`.
  The overview/timeline/dasha cards from `horahub-core.html`, productionized.
- **P3 — Auth + saved charts.** Better Auth + Prisma + Postgres. Multiple
  profiles. Chart cache in Redis (charts are deterministic → cache forever by
  birth-data hash).
- **P4 — Admin/ingestion UI.** The review queue from §2.5. Now you can add the
  other books safely.
- **P5 — Vargas + transits.** D9/D10, gochara. Optional, additive.

---

## 6. Beginner deployment guide (zero DevOps assumed)

Stack chosen for "cheapest + simplest that actually scales": **Vercel** (app) +
**Neon** (Postgres) + **Upstash** (Redis). All have free tiers; all are
GitHub-native; no servers to manage.

### 6.1 GitHub
1. Create account at github.com → **New repository** → name `horahub`, Private to
   start (flip to Public after you've confirmed `/sources/` is git-ignored).
2. Locally: `git init`, add a `.gitignore` containing `kb/sources/`, `.env*`,
   `node_modules`. **Verify** the books aren't staged: `git status` must not list
   any PDF. Then `git push`.

### 6.2 Database — Neon (Postgres)
1. neon.tech → sign in with GitHub → **Create project** (pick a region near your
   users; for India, choose the closest available, e.g. Singapore).
2. Copy the **connection string** (`postgresql://...`). Neon gives a *pooled* and
   a *direct* URL — use pooled for the app, direct for migrations.
3. Locally put both in `.env`:
   ```
   DATABASE_URL="postgresql://...pooler..."
   DIRECT_URL="postgresql://...direct..."
   ```
4. `npx prisma migrate dev --name init` (dev), `npx prisma migrate deploy` (prod).
5. **Backups:** Neon keeps automatic point-in-time history (7 days free). For
   real safety add a nightly `pg_dump` GitHub Action to object storage.
   **Restore:** Neon → Branches → restore to a timestamp, or `pg_restore` a dump.

### 6.3 Redis — Upstash
1. upstash.com → **Create database** → Regional, same region as above.
2. Copy `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` into env.

### 6.4 App — Vercel
1. vercel.com → **Add New → Project** → import the `horahub` repo. Vercel
   auto-detects Next.js; no build config needed.
2. **Environment Variables** (Settings → Environment Variables): paste
   `DATABASE_URL`, `DIRECT_URL`, `UPSTASH_*`, `AUTH_SECRET` (generate with
   `openssl rand -base64 32`), and any OAuth keys. Set them for *Production* and
   *Preview*.
3. **Build command:** `prisma generate && next build`. **Deploy.**
4. Every push to `main` now auto-deploys; every PR gets a preview URL. That's
   your release workflow: branch → PR → preview → merge to `main` → production.

> Swiss Ephemeris note: the WASM build runs in Vercel serverless functions. If
> you use the Python `pyswisseph` route instead, deploy `ephemeris/` as a small
> separate service on **Render** or **Railway** (one Dockerfile, $0–7/mo) and
> call it over HTTP. Keep the rest on Vercel.

### 6.5 Domain + SSL
1. Buy a domain (Namecheap / Cloudflare Registrar — Cloudflare sells at cost).
2. Vercel → Project → **Domains** → add `horahub.app` and `www.horahub.app`.
3. Vercel shows the DNS records to add (an `A`/`CNAME` or nameserver change). Add
   them at your registrar. **SSL is automatic** — Vercel provisions Let's Encrypt
   certs once DNS verifies. Set the non-www → www (or reverse) redirect in the
   Domains panel.

### 6.6 Production checklist
- [ ] Auth: secure cookies, CSRF on mutations, rate-limit login.
- [ ] Rate limiting: Upstash `@upstash/ratelimit` on chart-generation route.
- [ ] Error tracking: Sentry (free tier) — `@sentry/nextjs`.
- [ ] Logging: Vercel logs + Sentry breadcrumbs.
- [ ] SEO: `app/sitemap.ts`, `app/robots.ts`, per-page metadata.
- [ ] Analytics: Vercel Analytics or Plausible (privacy-friendly).
- [ ] Uptime: cron-job.org or Better Stack pinging `/api/health`.
- [ ] DB backups: nightly `pg_dump` action verified by a test restore.
- [ ] `/sources/` confirmed absent from the public repo.

---

## 7. Cost estimates (₹ ≈ at $1 = ₹83)

Charts are deterministic and cached, so cost scales with *unique charts* far more
than with traffic. Assumes mostly-free-tier-friendly usage.

| Users | App (Vercel) | DB (Neon) | Redis (Upstash) | Ephemeris svc | Domain | ~Total/mo |
|---|---|---|---|---|---|---|
| 100 | $0 (Hobby) | $0 | $0 | $0–7 | ~$1 | **$0–8** |
| 1,000 | $0–20 | $0–19 | $0 | $7 | $1 | **$8–47** |
| 10,000 | $20 (Pro) | $19 | $10 | $7–25 | $1 | **$57–75** |
| 100,000 | $20–150 | $69+ | $25+ | $25–50 | $1 | **$120–300** |

Email (if you add transactional mail): Resend free to 3k/mo, then ~$20/mo.
The single biggest lever: cache charts by a hash of normalized birth data → an
identical birth never recomputes, and the interpretation is pure, so it caches too.

---

## 8. Scaling notes

- **MVP–1k:** serverless + managed DB as above. Do nothing clever.
- **10k:** add the Redis chart cache if you haven't; move ephemeris to its own
  always-warm service to kill cold-start latency on the math.
- **100k:** Neon autoscaling or move to a dedicated Postgres; precompute the
  heavy vargas in a background worker (queue: Upstash QStash or BullMQ) instead of
  per-request; put static/report assets behind the Vercel/CDN edge.
- **1M:** read replicas for Postgres; the interpretation layer is stateless so it
  scales horizontally for free; shard the chart cache; consider materializing
  popular report sections.
- The architecture's gift: because `ephemeris/` and `interpret/` are pure and
  deterministic, almost everything is cacheable and horizontally scalable. The
  only stateful pieces are auth and saved charts.

---

## 9. Maintenance & adding new books

1. Drop the new PDF in `kb/sources/` (local only).
2. Run `scripts/ingest` → OCR → normalize → segment → encode (your words) → review
   queue.
3. Approve rules in the admin UI → tag a new `kb-vN`.
4. Existing user reports keep their old KB version; new reports use `kb-vN`.
5. `prisma migrate deploy` only if the schema changed; KB data updates don't need
   migrations.
6. Rollback: Vercel keeps every deployment — "Promote" a previous one to roll back
   the app instantly; restore the DB from a Neon branch if data changed.

---

*Built honest: real astronomy, sourced interpretation, no fabricated confidence,
no redistributed copyrighted text. That combination is also what makes it a
credible open-source project rather than one more horoscope site.*
