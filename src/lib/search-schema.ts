import { z } from "zod";

// Autocomplete query, shared by the search route and the search box.
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 60;

export const searchQuery = z
  .string({ error: "Type a name." })
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(SEARCH_MIN, "Keep typing.").max(SEARCH_MAX, "That's a long name. Try fewer words."));

export const searchKind = z.enum(["entity", "via"], { error: "Unknown search." });

/** What the search route returns, for any mode. `meta` is a short qualifier (a year, a department). */
export type SearchResult = { id: string; name: string; meta: string | null; img: string | null };
