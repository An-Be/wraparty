import { z } from "zod";

// Autocomplete query, shared by the search routes and the search box.
export const SEARCH_MIN = 2;
export const SEARCH_MAX = 60;

export const searchQuery = z
  .string({ error: "Type a name." })
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(SEARCH_MIN, "Keep typing.").max(SEARCH_MAX, "That's a long name. Try fewer words."));

/** What the search routes return. Thumbnails only; no TMDB internals. */
export type PersonResult = { id: number; name: string; img: string | null; dept: string | null };
export type MovieResult = { id: number; title: string; year: number | null; img: string | null };
