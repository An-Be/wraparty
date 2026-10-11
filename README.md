# tool-template

The shared base for tiny, mobile-first tools: one shared link, no login,
monochrome. TabMath and TagYourTurn are built on it.

**New tool?** Follow [`docs/new-tool.md`](./docs/new-tool.md).

## What you get

- **Next.js 16 + React 19 + TypeScript**, Tailwind 4, hand-rolled UI primitives in the monochrome system
- **Postgres on Neon + Prisma 7** with a capped connection pool, a least-privilege
  app role, and a build-time schema drift check
- **Security by default**: per-request nonce CSP with violation reporting, HSTS
  and friends, CSRF guard, size-capped Zod-validated bodies, 128-bit secret links,
  `no-store` + `noindex` on secret routes, Postgres-backed rate limiting
- **A working example**: create a "space", share its secret link, replace the
  link. It exercises every pattern above; replace it with your tool.
- **Agent rules** in `AGENTS.md` (Claude Code reads it via `CLAUDE.md`)
- **Vitest** with tests for every shared helper

Optional modules are documented in [`docs/modules/`](./docs/modules), with
TabMath as the reference implementation:
[accounts + guest sessions](./docs/modules/auth-clerk.md),
[photo uploads](./docs/modules/uploads-uploadthing.md),
[AI extraction](./docs/modules/ai-extraction.md).
Product analytics with PostHog is built in and stays off until you add its env
vars: [analytics](./docs/modules/analytics-posthog.md).

## Run it

```bash
npm install
cp .env.example .env      # app-role pooled + direct Neon URLs
npx prisma migrate deploy # with the owner role, first time only
npm run dev
```

## Commands

```bash
npm run dev         # dev server
npm run build       # prisma generate + drift check + next build
npm run typecheck   # next typegen + tsc
npm run lint
npm test            # vitest
```

## Design system

Monochrome, two voices, 1px borders, zero radius, numbered section labels.

| Token | Use |
| --- | --- |
| `ink` / `paper` | text and background, borders |
| `mute` / `faint` | secondary text, placeholders |
| `wash` | hover, read-only fields |
| `display` utility | Space Grotesk headlines and big numbers |
| `label` utility | 11px uppercase mono labels |

Primitives: `Button` (+ `buttonVariants` for links), `Input` (`mono` or
`display`), `Textarea`, `Field`, `Switch`, `Dialog` (native `<dialog>`),
`Toaster` + `toast()` from `src/lib/toast.ts`, `CopyField`, `SectionLabel`,
`Shell` (`narrow` or `wide`), `Divider`.

## Keeping tools in sync

Tools copy the template; they don't depend on it. Shared files are
everything above "This tool" in `AGENTS.md`, `CLAUDE.md`, the configs
(`tsconfig`, ESLint, PostCSS, Vitest, `prisma.config.ts`, `scripts/db-check.mjs`),
`src/app/globals.css`, `src/components/ui/*`, `src/components/site/site-*.tsx`,
`src/lib/{api-client,clipboard,csp,csp-report,rate-limit-window,toast,utils}.ts`,
`src/lib/server/{db,http,token,client-ip,rate-limit}.ts` and the CSP report route.
When one improves here, copy it into each tool and open a PR. Tool-specific
values live in `src/config/`, so shared files copy over cleanly.
