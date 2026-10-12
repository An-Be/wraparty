import { moviesCopy } from "./movies";
import type { ModeCopy } from "./types";

// Modes with a playable implementation. A GameMode row can exist (as "coming
// soon") before its mode is registered here; it can only go LIVE after.
const modes: Record<string, ModeCopy> = {
  [moviesCopy.slug]: moviesCopy,
};

export function modeCopy(slug: string): ModeCopy | null {
  return Object.hasOwn(modes, slug) ? modes[slug] : null;
}

/** For components handed a live mode's slug by the server: a missing copy is a bug, not a user error. */
export function requireModeCopy(slug: string): ModeCopy {
  const copy = modeCopy(slug);
  if (!copy) throw new Error(`No copy registered for mode "${slug}".`);
  return copy;
}

/** Cheap format check before any lookup by slug (URL segments, query params). */
export function isWellFormedSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]{1,23}$/.test(value);
}
