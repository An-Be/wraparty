import { posthogCsp } from "@/lib/analytics";
import { mergeDirectives, type CspDirectives } from "@/lib/csp";

// Per-tool additions to the Content-Security-Policy, merged into the strict
// defaults in src/lib/csp.ts. Add only the origins a feature actually needs and
// say why next to each one. See docs/modules/*.md for module entries.
export const cspAllowlist: CspDirectives = mergeDirectives(
  {
    // TMDB headshots and posters. Images load straight from TMDB's CDN; all API
    // calls (and the key) stay on our server.
    "img-src": ["https://image.tmdb.org"],
  },
  // PostHog ingest + its lazy-loaded scripts; empty when analytics is off.
  posthogCsp(process.env.NEXT_PUBLIC_POSTHOG_HOST),
);
