import type { KindLabels, RejectCode } from "@/lib/chain";

/**
 * Everything the shared UI needs to know about a game mode: its nouns and its
 * wording. Client-safe (no fetching, no keys). The facts live in the mode's
 * server adapter (src/lib/server/modes/). Adding a mode = one of these, one
 * adapter, a GameMode row and a seed script.
 */
export type ModeCopy = {
  slug: string;
  /** "Movies", for share text and headings. */
  name: string;
  labels: KindLabels;
  /** Under the pair: how a link works in this mode. */
  howTo: string;
  /** Prompt above the search box when the next pick is a via. */
  pickVia: (entityName: string) => string;
  /** Prompt when the next pick is an entity. */
  pickEntity: (viaName: string) => string;
  placeholder: { entity: string; via: string };
  hint: { entity: string; via: string };
  /** Empty search results. */
  noMatches: string;
  /** Why a pick was turned down, with both names in hand. */
  rejected: (code: Exclude<RejectCode, "not-found">, entityName: string, viaName: string) => string;
  /** Toast when picking a via finishes the chain: the target is in it. */
  finished: (targetName: string, viaName: string) => string;
};
