import "server-only";
import type { z } from "zod";
import type { SearchResult } from "@/lib/search-schema";
import {
  movieWithCredits,
  releaseYear,
  searchMovieResponse,
  searchPersonResponse,
  TMDB_API_BASE,
  tmdbImage,
  type MovieWithCredits,
} from "@/lib/tmdb";
import { SourceError } from "./modes/source";

// Server-side TMDB client for the Movies mode. The token never leaves this
// module: the adapter calls these functions and returns trimmed results, so no
// client bundle ever sees the key. Responses are cached in Next's data cache.

const SEARCH_TTL_SECONDS = 60 * 60;
const CREDITS_TTL_SECONDS = 6 * 60 * 60;
const MAX_RESULTS = 8;

export class TmdbError extends SourceError {
  constructor(message: string, kind: "not-configured" | "upstream") {
    super("tmdb", message, kind);
  }
}

async function tmdbGet<S extends z.ZodType>(
  path: string,
  params: Record<string, string>,
  schema: S,
  revalidate: number,
): Promise<z.infer<S> | null> {
  const token = process.env.TMDB_API_TOKEN;
  if (!token) throw new TmdbError("TMDB_API_TOKEN is not set.", "not-configured");

  // TMDB_API_BASE_URL exists only to point local tests at a fake TMDB.
  const url = new URL(`${process.env.TMDB_API_BASE_URL || TMDB_API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new TmdbError(`TMDB request failed: ${path}`, "upstream");
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new TmdbError(`TMDB ${res.status}: ${path}`, "upstream");

  const parsed = schema.safeParse(await res.json().catch(() => null));
  if (!parsed.success) throw new TmdbError(`TMDB returned an unexpected shape: ${path}`, "upstream");
  return parsed.data;
}

export async function searchPeople(query: string): Promise<SearchResult[]> {
  const data = await tmdbGet(
    "/search/person",
    { query, include_adult: "false", language: "en-US", page: "1" },
    searchPersonResponse,
    SEARCH_TTL_SECONDS,
  );
  return (data?.results ?? [])
    .filter((p) => !p.adult)
    .slice(0, MAX_RESULTS)
    .map((p) => ({ id: String(p.id), name: p.name, meta: p.known_for_department, img: tmdbImage(p.profile_path, "w92") }));
}

export async function searchMovies(query: string): Promise<SearchResult[]> {
  const data = await tmdbGet(
    "/search/movie",
    { query, include_adult: "false", language: "en-US", page: "1" },
    searchMovieResponse,
    SEARCH_TTL_SECONDS,
  );
  return (data?.results ?? [])
    .filter((m) => !m.adult && !m.video)
    .slice(0, MAX_RESULTS)
    .map((m) => {
      const year = releaseYear(m.release_date);
      return { id: String(m.id), name: m.title, meta: year ? String(year) : null, img: tmdbImage(m.poster_path, "w92") };
    });
}

/** A movie with its full cast and crew, or null if TMDB doesn't know the id. */
export async function getMovie(id: number): Promise<MovieWithCredits | null> {
  return tmdbGet(`/movie/${id}`, { append_to_response: "credits", language: "en-US" }, movieWithCredits, CREDITS_TTL_SECONDS);
}
