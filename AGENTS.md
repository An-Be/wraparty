<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

> **Everything below is project-owned and must stay OUTSIDE the markers above.**
> `next dev` replaces everything between `BEGIN:nextjs-agent-rules` and
> `END:nextjs-agent-rules` whenever it doesn't match. Text before and after is kept.

# Project rules

This repo follows **tool-template** (github.com/An-Be/tool-template), the shared
base for Andrea's tiny tools. Tool-specific context goes in the "This tool"
section at the bottom; everything above it is shared and should stay in sync
with the template.

## Never commit or push without asking

Do not run `git commit` or `git push` on your own initiative, even for a small,
verified fix. Make the change, verify it, say what you'd commit, and ask. Every
time. A push to `main` deploys to production on Vercel.

## Stack

- **Next.js 16** (App Router, Turbopack, RSC by default), **React 19**, **TypeScript 5** strict
- **Tailwind CSS 4**, CSS-first: tokens live in `src/app/globals.css` under `@theme`. No `tailwind.config`.
- **Hand-rolled UI primitives** in `src/components/ui/` (no shadcn, no Base UI). `cn()` from `src/lib/utils.ts`, variants with `cva`.
- **Postgres on Neon** + **Prisma 7** with `@prisma/adapter-pg`
- **Zod 4** for every external input
- **Vitest** for pure logic
- **Vercel**, region `cle1` (next to Neon `aws-us-east-2`)

### Version rules that override older training data

- `middleware.ts` is **`src/proxy.ts`** in Next 16. Node runtime only.
- `params`, `searchParams`, `cookies()` and `headers()` are **async**. `await` them.
- Page props are typed with the generated global `PageProps<"/route/[param]">`
  (run `next typegen`, which `npm run typecheck` does).
- Prisma 7: generator is `prisma-client` (not `prisma-client-js`), output
  `src/lib/generated/prisma` (gitignored). Import from
  `@/lib/generated/prisma/client`, **never** `@prisma/client`. The datasource URL
  is in `prisma.config.ts`, not `schema.prisma`. A driver adapter is mandatory
  (`src/lib/server/db.ts`).

## Layout

```
src/app/                 routes; Server Components fetch, client components render
src/app/api/             route handlers
src/components/ui/       hand-rolled primitives (Button, Input, Field, Dialog, Switch, Toast, CopyField, SectionLabel, Shell)
src/components/site/     header, footer, mark
src/components/<feature>/ feature components
src/config/              site.ts (name, copy), csp.ts (CSP allowlist), routes.ts (secret path prefixes)
src/lib/                 pure logic, no JSX; safe on client and server
src/lib/server/          server-only modules (each imports "server-only")
src/proxy.ts             per-request nonce CSP
src/instrumentation-client.ts  PostHog init (off without env vars)
prisma/                  schema, migrations, sql/app-role.sql
scripts/db-check.mjs     build-time schema drift check
```

## Security (non-negotiable)

- **No secrets on the client.** Never prefix a secret with `NEXT_PUBLIC_`. Every
  module that touches the database or a secret lives in `src/lib/server/` and
  imports `server-only`, so importing it from a client component fails the build.
- **Secret links are credentials.** Generate them with `newToken()` (128-bit,
  base62). Never use `cuid()`/`uuid()` for anything that grants access.
  Format-check with `isWellFormedToken()` before querying.
- **Every mutating route starts with `rejectCrossSite(req)`** (CSRF: Sec-Fetch-Site,
  Origin, JSON content type), then `checkRateLimit()` if the route costs anything
  (writes, AI calls, uploads), then `parseJsonBody(req, schema)`. Start new routes by copying an existing
  mutating route (in the template: `src/app/api/spaces/route.ts`).
- **Zod object schemas strip unknown keys**; that is what blocks mass assignment.
  Never use `.passthrough()` / `.loose()`.
- **Return 404, not 403**, for a resource that doesn't exist or isn't the caller's,
  so ids and tokens can't be probed.
- **Select only the fields a view needs** and pass only those across the
  server/client boundary. Never hand a whole row to a client component.
- **Secret-link pages**: add the prefix to `privateHeaders` in `next.config.ts`
  (`no-store`, `noindex`) and to `secretPathPrefixes` in `src/config/routes.ts`
  (log redaction). Page titles never include user content.
- **CSP** is built per request in `src/proxy.ts` with a nonce and must stay the only
  CSP header. Add third-party origins in `src/config/csp.ts`, one comment per entry.
  Violations are logged by `/api/csp-report` (filter Vercel logs on `[csp]`).
- **No inline `style` attributes.** Production CSP is nonce-only for styles.
- **Analytics never carries a secret or a person.** Send events only through
  `track()` (`src/lib/track.ts`) with flat counts, modes and outcomes: no names,
  free text, tokens or per-person amounts. URLs are redacted by `redactEvent`
  (`src/lib/analytics.ts`) from `secretPathPrefixes`; session replay stays off
  unless a tool turns it on with full text masking. See
  `docs/modules/analytics-posthog.md`.

## Database

- The app connects as a **least-privilege role** (`prisma/sql/app-role.sql`):
  row access on app tables only, no DDL.
- **Migrations are applied by the Neon owner role**, not the app role. After a
  migration adds a table, extend the app role's grants.
- `npm run build` runs `scripts/db-check.mjs`, which fails the build if the live
  database doesn't match `schema.prisma` (required on Vercel, skipped locally
  without `DIRECT_URL`).
- A migration folder's name is its sort order. Generate new ones with
  `npx prisma migrate dev --name <name>` or, by hand,
  `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script`
  into a folder timestamped **after** the latest one.
- Concurrency: when two writers can race (two phones tapping at once), lock the
  parent row (`SELECT ... FOR UPDATE` in a transaction) or lean on a unique index.

## Code rules

- Server Components by default. `"use client"` only for state, handlers or browser APIs.
  Initial data is fetched on the server and passed down, never fetched client-side on load.
- **No default exports** except files Next or a tool requires (`page`, `layout`,
  `not-found`, `manifest`, `route` handlers are named exports, configs).
- **One component per file.** Early returns over nesting. **No `any`.**
- Client calls to our own API go through `api()` in `src/lib/api-client.ts`.
- Pure logic belongs in `src/lib/*.ts` with a `*.test.ts` next to it.
- `next/link` for internal links; plain `<a>` only for links that leave the app.
- Colors come from tokens (`ink`, `paper`, `mute`, `faint`, `wash`, and `rule` for the header hairline). Dark mode follows the device
  (`prefers-color-scheme`) by redefining those tokens in `globals.css`; never
  hard-code a color or add `dark:` variants, and check both modes before shipping. Type is
  `display` (Space Grotesk) or mono; small caps text uses the `label` utility.
  Sections are numbered with `SectionLabel`.
- Inputs use 16px text on mobile so iOS doesn't zoom.

## Validating changes

A green `build`, `typecheck` and `lint` are not validation. When you add a
conditional, fallback, retry or anything that depends on external state:

1. Find every consumer with `grep`, not memory.
2. Exercise every branch at runtime (a `curl` sequence against `npm run dev`, or
   a script against a real database).
3. Check the blast radius: which other surfaces could this break?
4. Say what you couldn't exercise.

## Commands

```bash
npm run dev         # dev server
npm run build       # prisma generate + drift check + next build
npm run typecheck   # next typegen + tsc
npm run lint
npm test            # vitest
npx prisma studio
```

## This tool

**Wraparty**: a daily movie-connection game. One pair of people per UTC day,
same for everyone. Players chain person → movie → person until they reach
person B; fewest links (movies) wins. Scored against par in tiers
(Under par / Par / Over par). No login, no AI.

### Domain rules

- **Facts, not vibes.** A link counts when TMDB credits the person in the movie
  as cast in a real role, or as director. Self/archive-footage appearances don't
  count (`isCountableRole` in `src/lib/tmdb.ts`). Player validation uses full
  credit lists; only par uses the bounded graph (top 20 movies per person,
  top 15 billed cast + directors per movie).
- **Par is computed once at seed time** (`scripts/seed-puzzles.ts`, bidirectional
  BFS in `src/lib/par.ts`), never at runtime.
- **Puzzle dates are append-only.** The seed script schedules new pairs after the
  last scheduled date and refuses to overwrite one. When the list runs out,
  `getPuzzleForDate` wraps through the list in date order (`wrappedIndex`).
- **Playable dates** are today and yesterday (UTC), so a game started before
  midnight can finish. No archive.
- **Solves** are anonymous: one row per (date, deviceId), deviceId a random UUID
  from localStorage. Links and tier are recomputed server-side from the
  re-validated path. Streaks and stats live only in localStorage.
- TMDB data is never stored, only cached briefly in Next's data cache. Only
  curated pairs and solve aggregates live in Postgres.

### Routes

- `/` today's puzzle (server-rendered), chain builder, result screen
- `GET /api/puzzle/today`
- `GET /api/tmdb/search-person?q=`, `GET /api/tmdb/search-movie?q=` (proxy, rate limited)
- `POST /api/puzzles/[date]/validate-step` `{fromPersonId, movieId}` or `{movieId, toPersonId}`
- `POST /api/puzzles/[date]/solves` `{deviceId, path}`

### Env

`TMDB_API_TOKEN` (server-only, TMDB "API Read Access Token"). `TMDB_API_BASE_URL`
exists only to point local tests at a fake TMDB; never set it in production.

`WRAPARTY_LIVE`: the launch switch (`src/lib/launch.ts`). Production shows the
"crew is setting up" screen and 404s every game API route until it is `true`
for Production in Vercel, followed by a redeploy. Local dev and preview deploys
are always open, so seeding production doesn't launch the game by itself.

### Seeding

`npm run seed -- --dry-run` resolves names in `scripts/seed/pairs.txt`, computes
par and writes `scripts/.seed-report.json`. Drop `--dry-run` to schedule the
keepers. Default TMDB budget is 40 requests / 10 s (`--rate`); responses are
cached in `scripts/.tmdb-cache` so re-runs are cheap.

### Documented exceptions

- No secret links: `secretPathPrefixes` is empty and `site.indexable` is true.
- TMDB images use plain `<img>` (`src/components/game/photo.tsx`): `next/image`
  sets an inline style the nonce CSP blocks. `image.tmdb.org` is in `img-src`.
- `src/instrumentation-client.ts` sets Zod to `jitless` so its eval probe doesn't
  trip the CSP on every page load. Worth porting to tool-template.
