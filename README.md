# WrapParty

A daily movie-connection game. One pair of people a day, same for everyone:
connect Meryl Streep to Keanu Reeves through movies they were in, in as few
links as you can. Mobile-first, no login, scored in friendly tiers against par.

Built on [tool-template](https://github.com/An-Be/tool-template): Next.js 16,
React 19, Tailwind 4, Prisma 7 on Neon, hand-rolled monochrome UI. Movie data
from [TMDB](https://www.themoviedb.org) (this product uses the TMDB API but is
not endorsed or certified by TMDB).

## How it works

- Every link is checked server-side against TMDB credits: acting in a real role
  or directing. Playing yourself in a documentary doesn't count.
- Par is the shortest chain the seed script found, computed once per puzzle.
- Streaks and stats live on the device. Solves are reported anonymously to show
  "312 solved today, average 4.2 links".
- The TMDB token never reaches the browser: search and validation go through
  our own API routes.

## Run it

```bash
npm install
cp .env.example .env       # Neon URLs (app role) + TMDB_API_TOKEN
npx prisma migrate deploy  # with the owner role, first time only
npm run seed -- --dry-run  # resolve the curated pairs, compute par
npm run seed               # schedule them as daily puzzles
npm run dev
```

The curated pairs live in [`scripts/seed/pairs.txt`](./scripts/seed/pairs.txt).
Pairs outside par 2–4 are skipped automatically; the seed report
(`scripts/.seed-report.json`) shows what was kept and why.

## Commands

```bash
npm run dev         # dev server
npm run build       # prisma generate + drift check + next build
npm run typecheck   # next typegen + tsc
npm run lint
npm test            # vitest
npm run seed        # schedule puzzles from scripts/seed/pairs.txt
```

Project rules, domain rules and routes are in [`AGENTS.md`](./AGENTS.md).
