# Spinning up a new tool

About 20 minutes from template to a deployed, secured app.

## 1. Repo

1. On GitHub, **Use this template → Create a new repository** from `An-Be/tool-template`.
2. Clone it, then `npm install`.

## 2. Name it

- `src/config/site.ts`: name, description, tagline, theme color.
- `package.json`: `name`.
- `src/components/site/mark.tsx` and `src/app/icon.svg`: the tool's mark.
- `AGENTS.md`: fill in **This tool** at the bottom.
- `README.md`: replace with the tool's own.

## 3. Model

1. Replace the example `Space` model in `prisma/schema.prisma`. Keep `RateLimitHit`.
2. Replace the example routes (`src/app/api/spaces`, `src/app/t/[token]`,
   `src/components/spaces`, `src/lib/spaces-schema.ts`, `src/lib/server/spaces.ts`).
3. If the secret-link prefix changes from `/t/`, update `privateHeaders` in
   `next.config.ts`, `secretPathPrefixes` in `src/config/routes.ts`, and the proxy matcher if needed.
4. Delete `prisma/migrations/*_init` and generate a fresh init migration.

## 4. Database (Neon)

1. Create a Neon project in `aws-us-east-2`.
2. Put the **owner** connection string in a local `.env` as `DIRECT_URL` and run
   `npx prisma migrate deploy` to create the tables.
3. In the Neon SQL editor, run `prisma/sql/app-role.sql` (as the owner) with a
   real role name and password, listing every app table.
4. Switch `.env` to the app role: pooled string as `DATABASE_URL`, direct as `DIRECT_URL`.
5. `npm run db:check` should print "database matches schema.prisma".

## 5. Vercel

1. Import the repo. Region is already `cle1` (`vercel.json`).
2. Add `DATABASE_URL` and `DIRECT_URL` (app role) as **Sensitive** env vars for
   Production. The drift check requires `DIRECT_URL` on production deploys only;
   previews build without it. For previews that talk to a database, point them
   at a Neon branch, never the production one.
3. Optional: create a PostHog project for the tool and add
   `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` + `NEXT_PUBLIC_POSTHOG_HOST`
   ([analytics](./modules/analytics-posthog.md)).
4. Deploy, then point the domain.

## 6. Before sharing the link

- [ ] `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass
- [ ] Every mutating route: `rejectCrossSite` → rate limit (if it costs anything) → `parseJsonBody`
- [ ] Secret links use `newToken()`; secret routes are `no-store` + `noindex`
- [ ] No `NEXT_PUBLIC_` secrets; DB code only in `src/lib/server/`
- [ ] Browser console shows no CSP violations on every page
- [ ] If PostHog is on: a pageview on a secret link shows `[secret]` in PostHog, not the token
- [ ] PNG icons (192, 512, maskable) in `public/` and listed in `src/app/manifest.ts`
