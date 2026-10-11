import "server-only";
import type { z } from "zod";
import type { MovieResult, PersonResult } from "@/lib/search-schema";
import {
  movieWithCredits,
  releaseYear,
  searchMovieResponse,
  searchPersonResponse,
  TMDB_API_BASE,
  tmdbImage,
  type MovieWithCredits,
} from "@/lib/tmdb";

// Server-side TMDB client. The token never leaves this module: routes call these
// functions and return trimmed results, so no client bundle ever sees the key.
// Responses are cached in Next's data cache for a short while.

const SEARCH_TTL_SECONDS = 60 * 60;
const CREDITS_TTL_SECONDS = 6 * 60 * 60;
const MAX_RESULTS = 8;

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly kind: "not-configured" | "upstream",
  ) {
    super(message);
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


export async function searchPeople(query: string): Promise<PersonResult[]> {
  const data = await tmdbGet(
    "/search/person",
    { query, include_adult: "false", language: "en-US", page: "1" },
    searchPersonResponse,
    SEARCH_TTL_SECONDS,
  );
  return (data?.results ?? [])
    .filter((p) => !p.adult)
    .slice(0, MAX_RESULTS)
    .map((p) => ({ id: p.id, name: p.name, img: tmdbImage(p.profile_path, "w92"), dept: p.known_for_department }));
}

export async function searchMovies(query: string): Promise<MovieResult[]> {
  const data = await tmdbGet(
    "/search/movie",
    { query, include_adult: "false", language: "en-US", page: "1" },
    searchMovieResponse,
    SEARCH_TTL_SECONDS,
  );
  return (data?.results ?? [])
    .filter((m) => !m.adult && !m.video)
    .slice(0, MAX_RESULTS)
    .map((m) => ({ id: m.id, title: m.title, year: releaseYear(m.release_date), img: tmdbImage(m.poster_path, "w92") }));
}

/** A movie with its full cast and crew, or null if TMDB doesn't know the id. */
export async function getMovie(id: number): Promise<MovieWithCredits | null> {
  return tmdbGet(`/movie/${id}`, { append_to_response: "credits", language: "en-US" }, movieWithCredits, CREDITS_TTL_SECONDS);
}

/** The response for a route whose TMDB call failed: logged here, generic to the player. */
export function tmdbUnavailable(error: unknown): Response {
  if (error instanceof TmdbError) console.error(`[tmdb] ${error.kind}: ${error.message}`);
  else console.error("[tmdb] unexpected error", error);
  return Response.json({ error: "Movie data is unavailable right now. Try again in a minute." }, { status: 503 });
}
