# Next.js Performance Audit — visitagadir

_Audited: 2026-08-21. Scope: read-only inspection. No code changed._
_Stack: Next.js 16 (App Router) · React 19 · Prisma 6 + MySQL · standalone output · PM2 + Nginx on a single VPS._

---

## Executive Summary

The app feels fine in development (one user, local DB) but degrades in production for four compounding, **confirmed** reasons:

1. **Single-process runtime.** The deploy runs `pm2 start server.js` with no cluster mode (`-i`). One Node process, one CPU core, serves every request **and** runs all `next/image` sharp optimization. Under real concurrency (users + crawlers) the event loop and CPU saturate. This is the single biggest "only slow in prod" cause — dev never has concurrency.
2. **Every money page is dynamic SSR with no caching.** `listing/[slug]`, `category/[slug]`, `city/[slug]`, `blog/[slug]` have **no `generateStaticParams` and no `revalidate`** → each request re-renders and re-queries MySQL. Multiply by crawler traffic on 1000+ listing URLs and the DB + single Node process are the bottleneck.
3. **List/detail queries over-fetch huge columns.** Nearly every `findMany` omits `select` and pulls `description` (TEXT), `image` (MEDIUMTEXT), `gallery` (LONGTEXT), `logo` (MEDIUMTEXT) even when only name/slug/rating is rendered. `getNearby` pulls up to **200 full rows** per listing page. Big rows = slow DB reads + large serialization + memory pressure on the one process.
4. **Client-side request waterfall on every page.** After hydration the header, footer, ad bootstrap, each ad slot, and the pixel loader fire ~6–10 client API calls — several **duplicated** (`/api/categories` ×2, `/api/settings/public` ×2, `/api/ads` ×N) — each an **uncached** DB hit. Nginx does not cache `/api/*`, so `s-maxage` headers are inert.

Secondary: `next/image` optimizes `/uploads/*` through the same single Node process (Nginx doesn't cache `/_next/image`); the homepage ships as one ~1900-line client component pulling `framer-motion` + many Radix dialogs; category page runs a duplicate listing query.

**Do these first (highest impact, lowest effort):** PM2 cluster mode → add `select` to hot queries → serve `/uploads` unoptimized or via Nginx → pass header/footer/category data from the server instead of client refetch → add `revalidate` to detail pages.

---

## Critical Issues

### C1 — Single PM2 process, no clustering
- **Severity:** Critical · **Confidence:** Confirmed
- **File:** `scripts/vps-deploy.sh`, `scripts/vps-fix-pm2.sh`
- **Pattern:** `HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production pm2 start server.js --name visitagadir` — no `-i max`, no `exec_mode: cluster`.
- **Why:** One Node process = one CPU core for all SSR, all API routes, and all `next/image` sharp work. Concurrent requests queue behind each other. Dev never exposes this because there's no concurrency.
- **Fix:** `pm2 start server.js -i max` (or an `ecosystem.config.js` with `exec_mode: 'cluster'`, `instances: 'max'`). Note: the in-memory settings cache (`src/lib/seo/cache.ts`) becomes per-worker — acceptable (60s TTL) but see D6.
- **Expected impact:** Near-linear throughput gain with core count; removes head-of-line blocking under load.

### C2 — Money pages are fully dynamic, no ISR / static generation
- **Severity:** Critical · **Confidence:** Confirmed
- **Files:** `src/app/listing/[slug]/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/city/[slug]/page.tsx`, `src/app/blog/[slug]/page.tsx`
- **Pattern:** No `export const revalidate`, no `generateStaticParams`. Each request calls Prisma directly (`getListingSeoBundle`, `getCategorySeoBundle`, etc.).
- **Why:** With 1000+ listings, every crawler/user hit re-renders + re-queries. Combined with C1 and C3 this is what saturates the box. (`blog/page.tsx`, `blog/category/[slug]`, `sitemap.ts`, `robots.ts` correctly set `revalidate = 3600` — the detail pages were missed.)
- **Fix:** Add `export const revalidate = 3600` (or suitable TTL) to the four detail routes; optionally `generateStaticParams` for listings/categories to pre-render at build. Call `revalidatePath`/`revalidateTag` from admin mutation routes so edits publish immediately.
- **Expected impact:** Turns repeated DB-bound renders into cached HTML served in ms; cuts DB QPS dramatically under crawl.

### C3 — Queries over-fetch TEXT/MEDIUMTEXT/LONGTEXT columns (no `select`)
- **Severity:** Critical · **Confidence:** Confirmed (code) / Needs Measurement (row-size magnitude)
- **Files:** `src/lib/seo/internal-linking.ts` (`getFeaturedListings`, `getListingsInCategory`, `getRelatedInCategory`, `getSameCity`, `getNearby`, `getListingsInCity`), `src/app/api/listings/route.ts`, `src/app/api/categories/route.ts`, `src/lib/homepage-data.ts` (featured query), `src/app/category/[slug]/page.tsx`.
- **Pattern:** `db.listing.findMany({ include: { category: ... } })` with no `select`. The mapped output (`ListingLink`) needs only `name, slug, city, rating, featured, categoryName, image`, but Prisma returns the whole row: `description` TEXT, `image` MEDIUMTEXT, `gallery` LONGTEXT, `logo` MEDIUMTEXT, `openingHours`, all SEO fields. `getNearby` fetches up to **200 full rows** to return 6. `/api/categories` returns full category rows including `image` MEDIUMTEXT.
- **Why:** MEDIUMTEXT/LONGTEXT columns can hold base64 image data (schema uses these types precisely because some imported images are stored inline). Even for path-only rows, pulling every TEXT column for 60–200 rows inflates DB read time, network to Prisma, JSON serialization, and per-request memory on the single process.
- **Fix:** Add explicit `select` listing only the fields each helper maps. For image, prefer selecting a lightweight column or storing image URLs in a normal `VARCHAR` (see D5). Reduce `getNearby` candidate cap or select-then-hydrate only the winners.
- **Expected impact:** Large drop in query latency, payload size, and GC pressure — especially on category/listing/home renders.

### C4 — Client-side request waterfall + duplicate requests on every page
- **Severity:** High · **Confidence:** Confirmed
- **Files:** `src/components/site-header.tsx:84`, `src/components/site-footer.tsx:31`, `src/components/adsense-bootstrap.tsx:9`, `src/components/dynamic-ad-slot.tsx:137`, `src/components/tracking-pixels.tsx:170`
- **Pattern:** After hydration, per page load:
  - `site-header` → `/api/categories` + `/api/settings/public`
  - `site-footer` → `/api/categories` + `/api/settings/public` (**duplicates** header)
  - `adsense-bootstrap` → `/api/ads`
  - each `DynamicAdSlot` instance → `/api/ads` (**N duplicates** — one per slot on the page)
  - `tracking-pixels` → `/api/pixels`
- **Why:** 6–10 requests, several identical, each an uncached DB hit (Nginx proxies `/api/*` straight through — the `s-maxage`/`stale-while-revalidate` on `/api/pixels` never applies without a CDN). `site-header` already receives `branding` as a server prop but **refetches `/api/settings/public` anyway**. Categories are static-ish yet fetched twice client-side though the server already has them.
- **Fix:** (a) Pass categories + branding from the server (layout already loads settings) into header/footer as props; drop the client fetches. (b) Fetch `/api/ads` once (context/provider) and share to all slots + bootstrap. (c) Add real `Cache-Control` and dedupe. (d) If any must stay client-side, wrap in React Query (already a dependency) for request dedup.
- **Expected impact:** Removes most per-page API round-trips and their DB load; faster interactivity, lower QPS.

### C5 — `next/image` optimizes user uploads through the single Node process
- **Severity:** High · **Confidence:** Confirmed
- **Files:** `src/components/optimized-image.tsx`, `next.config.ts`, `scripts/nginx-visitagadir.conf`
- **Pattern:** `useUnoptimized = unoptimized ?? !isLocalImageSrc(src)`. `/uploads/...` starts with `/` → `isLocalImageSrc` true → **optimized = true**, so every upload is routed through `/_next/image` (sharp) on the Node server. Nginx only aliases `/uploads/` and proxies `/` — it does **not** cache `/_next/image`.
- **Why:** Sharp resize/encode is CPU-heavy and competes with SSR on the one core (C1). Cache misses re-optimize repeatedly.
- **Fix:** Serve `/uploads/*` as `unoptimized` (they're already sized on upload and Nginx caches them with `expires 30d`), **or** add an Nginx `proxy_cache` for `/_next/image`. Given uploads are user content of unknown dimensions, `unoptimized` for `/uploads` is the simplest win.
- **Expected impact:** Frees the CPU for SSR; removes a per-image latency + memory spike.

---

## Database Issues

| # | Location | Problem | Severity / Confidence | Fix |
|---|----------|---------|-----------------------|-----|
| D1 | `src/app/category/[slug]/page.tsx:57-70` | **Duplicate query**: `getListingsInCategory(slug,60)` then a second `db.listing.findMany({categoryId, take:60})` for the same rows — the second pulls all TEXT columns. | High / Confirmed | Fetch once with the fields both the schema and grid need; drop the second query. |
| D2 | `src/lib/seo/internal-linking.ts:getNearby` | Fetches up to **200 full listing rows** (all TEXT cols) per listing page to return 6 after haversine. | High / Confirmed | `select` minimal fields; lower cap; or compute distance in SQL. |
| D3 | All `internal-linking.ts` helpers, `api/listings`, `api/categories`, `homepage-data` | No `select` → over-fetch TEXT/MEDIUMTEXT/LONGTEXT (see C3). | Critical / Confirmed | Explicit `select`. |
| D4 | `src/app/api/listings/route.ts:78` | `searchEvent.create` fire-and-forget write on **every** browse/search request. Adds a write to a read path; unbounded table growth. | Medium / Confirmed | Batch/sample writes, or move to async queue; ensure it never blocks. Table has indexes (good). |
| D5 | `prisma/schema.prisma` (`Listing.image/gallery/logo`, `Category.image`) | Images stored in MEDIUMTEXT/LONGTEXT (base64 inline for imports). Uploads via `admin/upload` write files + store a path, but legacy/imported rows may hold base64 → every list query drags KBs–MBs per row. | High / Needs Measurement | Confirm with `SELECT AVG(LENGTH(gallery)), MAX(LENGTH(gallery)) FROM Listing`. If large, migrate to file paths + `VARCHAR`. |
| D6 | `src/lib/seo/cache.ts` | In-memory Map cache is per-process; under PM2 cluster (C1) each worker keeps its own copy (still fine at 60s TTL, but no cross-worker invalidation on admin edits). | Low / Confirmed | Acceptable now; move to Redis if multi-instance. |
| D7 | Search: `api/listings` `where.OR contains` on `name/description/address` | `LIKE %term%` on TEXT `description` = full scan, unindexed. | Medium / Confirmed | Add a FULLTEXT index or search only indexed short columns. |

Connection handling (`src/lib/db.ts`) is correct — singleton `PrismaClient`, guarded global in dev. Prisma pools connections by default; no leak found. Indexes on `slug`, `categoryId`, `city`, `featured`, `published`, `userId` exist (good).

---

## API Request Issues

| Endpoint | File | Problem | Impact | Fix |
|----------|------|---------|--------|-----|
| `/api/categories` | `src/app/api/categories/route.ts` | No `select` (returns `image` MEDIUMTEXT + all SEO cols); no `Cache-Control`; called 2×/page (header+footer). | Large duplicate payload + DB hit every page. | `select` name/slug/icon/_count; add cache header; pass from server. |
| `/api/settings/public` | `src/app/api/settings/public/route.ts` | Called 2×/page though server already has branding; header receives it as a prop yet refetches. | Redundant round-trips. | Drop client fetch; use server prop. |
| `/api/ads` | `src/app/api/ads/route.ts` | No `Cache-Control`; fetched by bootstrap **and** every ad slot → N duplicates/page. | Multiple identical DB reads/page. | Fetch once + share; add cache header. |
| `/api/pixels` | `src/app/api/pixels/route.ts` | Has `s-maxage`/`swr` but Nginx doesn't cache `/api/*`, so it's inert; 1 fetch/page. | Uncached DB read/page. | Fine if deduped; real caching needs CDN or Nginx `proxy_cache`. |
| `/api/listings?slug=` / `?featured=` / `?category=` | `src/app/api/listings/route.ts` | Over-fetch (D3); also invoked from `home-client` deep-link + related-listings effects. | Heavy payloads client-side. | `select`; prefer server data. |
| `/api/reviews` | `home-client.tsx:818,924` | Fetched client-side after listing load (waterfall: listing → reviews). | Extra RTT before reviews show. | Include reviews in the SSR listing bundle (already done in `getListingSeoBundle` for `/listing/[slug]`). |
| `listings.xml` | `src/app/listings.xml/route.ts` | `force-dynamic` → rebuilds full XML from DB every request. | Expensive on each hit. | Add `revalidate` instead of `force-dynamic`. |

**Waterfall summary (homepage):** server SSR (good, `initialData` passed) → hydrate ~1900-line client → header fetch ×2, footer fetch ×2, ads ×N, pixels ×1. The server work is fine; the **client tail** is the problem.

---

## Frontend Bundle Issues

- **F1 — Homepage is one ~1900-line Client Component** (`src/app/home-client.tsx`, `'use client'`). Pulls `framer-motion` (heavy), many Radix dialogs/selects, `MultiImageInput`, `ListingPhotosGallery`. Severity High / Confirmed. The page is server-rendered with `initialData`, but the entire interactive tree hydrates on the landing page. **Fix:** split static/presentational sections into Server Components; lazy-load the listing-detail dialog, add-business modal, and gallery via `next/dynamic`; keep only genuinely interactive leaves as client.
- **F2 — Heavy editor/deps in dependency tree:** `tinymce` (+ 12 MB `public/tinymce`), `quill`, `@mdxeditor/editor`, `react-syntax-highlighter`, `recharts`. Confirm these are admin-only and dynamically imported so they never enter the public bundle. Severity Medium / Needs Measurement. **Fix:** run `next build` and inspect route bundle sizes; `next/dynamic({ ssr:false })` for all editors/charts (admin already uses this pattern for some).
- **F3 — `framer-motion` on header + homepage.** `site-header.tsx` and `home-client.tsx` both import `motion`/`AnimatePresence`. Ships to every visitor. Severity Medium. **Fix:** replace simple animations with CSS, or lazy-load motion-heavy sections.
- Cannot measure exact bundle sizes without a production build; run `ANALYZE` (`@next/bundle-analyzer`) to quantify F1–F3.

---

## React Rendering Issues

- **R1 — Redundant client state hydration.** `site-header` receives `initialBranding` prop then overwrites it from a client fetch; `home-client` seeds state from `initialData` (correct — guarded by `if (initialData) return`). Header's refetch is wasted work + a flash. Severity Medium / Confirmed. **Fix:** trust the server prop (C4).
- **R2 — No egregious re-render bugs found.** `useMemo`/`useCallback` usage in `home-client`/`site-header` is reasonable (memoizing `activeCategoryData`, `fetchListings`). Effects have correct deps. Not recommending more memoization — not justified.
- **R3 — `reactStrictMode: false`** (`next.config.ts`). Not a perf issue (Strict Mode is dev-only) but it hides double-effect bugs; the pixel loader even has a comment about StrictMode. Low. Consider re-enabling in dev.

---

## Deployment Issues

| # | File | Problem | Severity | Fix |
|---|------|---------|----------|-----|
| P1 | `scripts/vps-deploy.sh` | Single PM2 process (see C1). | Critical | `pm2 start server.js -i max` / cluster ecosystem file. |
| P2 | `scripts/nginx-visitagadir.conf`, deploy Nginx block | No explicit `gzip`/brotli, no `proxy_cache`. Next's built-in gzip covers dynamic HTML/JS, but there's no edge caching of cacheable routes/images. | Medium | Enable `gzip on` (+ brotli); add `proxy_cache` for `/_next/image` and cacheable pages. |
| P3 | `scripts/vps-deploy.sh:6-9` | **Secrets committed in the repo**: `DB_PASS`, `NEXTAUTH_SECRET`, `ADMIN_SECRET_KEY` hardcoded. Also prints a real server IP. | Security (Critical) | Rotate all three secrets now; move to env/secret store; scrub from git history. _(Not perf, but must flag.)_ |
| P4 | `next.config.ts` | `typescript.ignoreBuildErrors: true` — type errors shipped silently; can mask perf/correctness regressions. | Low/Medium | Fix types; remove the flag. |
| P5 | `package.json` `start` / `server.js` | Production uses `NODE_ENV=production node server.js` (standalone) — **correct**, not `next dev`. `dev` script tees to `dev.log`. Verified prod ≠ dev. | ✅ OK | — |
| P6 | `scripts/vps-deploy.sh` | Uses `npm install` (not `npm ci`) and builds on the VPS box (competes with the running app for CPU/RAM during deploy). | Low | `npm ci`; build in CI or during a maintenance window. |
| P7 | `next.config.ts` images | `remotePatterns` + `formats` fine; but see C5 for the `/uploads` optimization path. | — | — |

Compression: Next standalone server gzips dynamic responses by default (`compress` defaults true, not overridden) — so HTML/JS are compressed even without Nginx gzip. Static assets have correct immutable cache headers (`/_next/static` 1y, `/uploads` 1d swr). No debug mode or excessive server logging found (`db` logs only `error`/`warn`; no `console.log` in server hot paths).

---

## Trace: Main Page Load

**Homepage `/`** (dynamic — `generateMetadata` awaits `searchParams`):
```
Request → Nginx proxy → Node (single core)
  → generateMetadata: getSeoSettings (cached 60s) 
  → getHomepageInitialData: Promise.all[ categories(+_count), featured listings(12, FULL rows incl gallery LONGTEXT), blog(4), appSettings(cached) ]   ← C3 over-fetch
  → HTML (server-rendered with initialData)  ✅ good
  → JS: hydrate ~1900-line client (framer-motion + radix)  ← F1 large
  → Post-hydration client tail:
       header → /api/categories + /api/settings/public   ← C4 (settings already in prop)
       footer → /api/categories + /api/settings/public   ← C4 duplicates
       adsense-bootstrap → /api/ads                        ← C4
       DynamicAdSlot ×N → /api/ads (each)                  ← C4 N-duplicates
       tracking-pixels → /api/pixels                       ← C4
```
Delay accumulates at: **featured-listings query** (heavy rows), **hydration** (big client bundle), and the **client API tail** (duplicated uncached DB hits).

**Listing `/listing/[slug]`** (dynamic, no revalidate — C2):
```
Request → Node → getListingSeoBundle:
  listing.findUnique(+category+reviews)                 (1 query)
  Promise.all[ seo, schema, getRelatedInCategory(6 FULL rows),
               getSameCity(6 FULL rows), getNearby(≤200 FULL rows) ]  ← D2/D3 heavy
  → schemas + HTML
```
Delay accumulates at: **`getNearby` 200-row scan** + all sidebar queries pulling TEXT columns, on a **non-cached** page hit every request.

**Category `/category/[slug]`** (dynamic — C2):
```
loadCategory → Promise.all[ seo, schema, getListingsInCategory(60 FULL), getRelatedCategories(8) ]
  → THEN a SECOND db.listing.findMany(60 FULL)   ← D1 duplicate, all TEXT cols
```
Delay: **two 60-row heavy queries** for the same data, uncached.

Middleware: **none** (no `middleware.ts`), though a `Redirect` model exists and `repository.ts` comments claim "hit on every proxy request." Redirects are currently **not enforced** — no middleware perf cost, but the feature is dead. (Not a slowdown.)

---

## Action Plan

### 1. Immediate — highest impact, low effort
1. **PM2 cluster mode** — `pm2 start server.js -i max` (C1/P1). Biggest single prod win.
2. **Add `select` to hot queries** — all `internal-linking.ts` helpers, `api/listings`, `api/categories`, `homepage-data` featured query (C3/D3). Cap/trim `getNearby` (D2).
3. **Kill the client waterfall** — pass categories + branding as server props to header/footer; delete their client fetches; fetch `/api/ads` once and share (C4).
4. **Stop optimizing `/uploads` through Node** — mark them `unoptimized` or add Nginx `proxy_cache` for `/_next/image` (C5).
5. **Add `revalidate` to detail pages** — `listing/[slug]`, `category/[slug]`, `city/[slug]`, `blog/[slug]` (C2), with `revalidatePath` on admin edits.
6. **Rotate the committed secrets** (P3) — security, do now.

### 2. Important optimizations
7. Remove the duplicate query on the category page (D1).
8. Measure real column sizes (D5); if base64 is inline, migrate images to file paths + `VARCHAR`.
9. Split the homepage client component; `next/dynamic` the dialogs/gallery/editors; confirm editors/charts are admin-only chunks (F1/F2/F3). Run `@next/bundle-analyzer`.
10. Enable Nginx gzip/brotli + `proxy_cache` for cacheable routes and images (P2).
11. Add proper `Cache-Control` to `/api/categories`, `/api/ads` (or eliminate via server props).

### 3. Optional
12. FULLTEXT index for search instead of `LIKE %…%` on `description` (D7).
13. Sample/queue `searchEvent` writes off the read path (D4).
14. `generateStaticParams` to pre-render listings/categories at build.
15. Fix TypeScript and drop `ignoreBuildErrors` (P4); `npm ci` + CI build (P6); re-enable Strict Mode in dev (R3).
16. Redis-back the settings cache if you scale beyond one instance (D6).

---

### Confirmed vs. needs measurement
- **Confirmed (code-level):** C1, C2, C3, C4, C5, D1, D2, D3, D4, D7, P1, P2, P3, P4, P6, R1, F1.
- **Needs measurement (magnitude):** D5 (base64 row sizes), F2/F3 (exact bundle KB) — quantify with a `SELECT LENGTH(...)` and a production `next build --analyze`.
