import type { ReactNode } from "react";
import { TmdbCredit } from "./tmdb-credit";

// Each mode's data source attribution, shown under its game. A new mode adds
// its source's required credit here (or nothing, if the source asks for none).
const credits: Record<string, () => ReactNode> = {
  movies: TmdbCredit,
};

export function ModeCredit({ slug }: { slug: string }) {
  const Credit = Object.hasOwn(credits, slug) ? credits[slug] : null;
  return Credit ? <Credit /> : null;
}
