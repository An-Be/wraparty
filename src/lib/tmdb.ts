import { z } from "zod";

// Pure TMDB helpers: response schemas, image URLs and the credit rules.
// Shared by the server client (src/lib/server/tmdb.ts) and the seed script,
// so player validation and par computation agree on what counts as a credit.
// No fetching and no key here.

export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** Bounds from the spec: keep the par search graph small. Player validation uses full credits. */
export const PAR_MOVIES_PER_PERSON = 20;
export const PAR_CAST_PER_MOVIE = 15;

// TMDB returns null for missing images and omits fields freely; every schema
// tolerates that. Zod objects strip unknown keys, so only these fields survive.
const nullableString = z.string().nullish().transform((v) => v ?? null);

export const searchPersonResponse = z.object({
  results: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      profile_path: nullableString,
      known_for_department: nullableString,
      popularity: z.number().nullish().transform((v) => v ?? 0),
      adult: z.boolean().nullish(),
    }),
  ),
});

export const searchMovieResponse = z.object({
  results: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      release_date: nullableString,
      poster_path: nullableString,
      popularity: z.number().nullish().transform((v) => v ?? 0),
      adult: z.boolean().nullish(),
      video: z.boolean().nullish(),
    }),
  ),
});

const castCredit = z.object({
  id: z.number().int(),
  name: z.string(),
  character: nullableString,
  order: z.number().nullish().transform((v) => v ?? 999),
  profile_path: nullableString,
});

const crewCredit = z.object({
  id: z.number().int(),
  name: z.string(),
  job: nullableString,
  profile_path: nullableString,
});

/** GET /movie/{id}?append_to_response=credits */
export const movieWithCredits = z.object({
  id: z.number().int(),
  title: z.string(),
  release_date: nullableString,
  poster_path: nullableString,
  credits: z.object({ cast: z.array(castCredit), crew: z.array(crewCredit) }),
});
export type MovieWithCredits = z.infer<typeof movieWithCredits>;

const personMovieCast = z.object({
  id: z.number().int(),
  title: z.string(),
  character: nullableString,
  release_date: nullableString,
  popularity: z.number().nullish().transform((v) => v ?? 0),
  video: z.boolean().nullish(),
});

const personMovieCrew = z.object({
  id: z.number().int(),
  title: z.string(),
  job: nullableString,
  release_date: nullableString,
  popularity: z.number().nullish().transform((v) => v ?? 0),
  video: z.boolean().nullish(),
});

/** GET /person/{id}?append_to_response=movie_credits */
export const personWithCredits = z.object({
  id: z.number().int(),
  name: z.string(),
  profile_path: nullableString,
  known_for_department: nullableString,
  movie_credits: z.object({ cast: z.array(personMovieCast), crew: z.array(personMovieCrew) }),
});
export type PersonWithCredits = z.infer<typeof personWithCredits>;

// ---- What counts as "being in a movie" -------------------------------------

/**
 * Appearing as yourself (documentaries, talk-show clips) or only through archive
 * footage isn't "being in a movie with" someone, so those cast credits don't count.
 */
const NON_ROLE = /\b(self|himself|herself|themselves|archive footage)\b/i;

export function isCountableRole(character: string | null): boolean {
  return !character || !NON_ROLE.test(character);
}

/** Acting (in a real role) or directing. */
export function isCountableCrewJob(job: string | null): boolean {
  return job === "Director";
}

/** Everyone credited in the movie under the rules above, full lists. */
export function creditedPeople(movie: MovieWithCredits): Map<number, string> {
  const people = new Map<number, string>();
  for (const c of movie.credits.cast) if (isCountableRole(c.character)) people.set(c.id, c.name);
  for (const c of movie.credits.crew) if (isCountableCrewJob(c.job)) people.set(c.id, c.name);
  return people;
}

export function isCreditedIn(movie: MovieWithCredits, personId: number): boolean {
  return creditedPeople(movie).has(personId);
}

/** Par graph edges from a movie: the top-billed countable cast plus its directors. */
export function topCastIds(movie: MovieWithCredits, n = PAR_CAST_PER_MOVIE): number[] {
  const cast = movie.credits.cast
    .filter((c) => isCountableRole(c.character))
    .sort((a, b) => a.order - b.order)
    .slice(0, n)
    .map((c) => c.id);
  const directors = movie.credits.crew.filter((c) => isCountableCrewJob(c.job)).map((c) => c.id);
  return [...new Set([...cast, ...directors])];
}

/** Par graph edges from a person: their most popular acted or directed movies. */
export function topMovieIds(person: PersonWithCredits, n = PAR_MOVIES_PER_PERSON): number[] {
  const byId = new Map<number, number>();
  const add = (id: number, popularity: number, video: boolean | null | undefined) => {
    if (video) return;
    byId.set(id, Math.max(byId.get(id) ?? 0, popularity));
  };
  for (const c of person.movie_credits.cast) if (isCountableRole(c.character)) add(c.id, c.popularity, c.video);
  for (const c of person.movie_credits.crew) if (isCountableCrewJob(c.job)) add(c.id, c.popularity, c.video);
  return [...byId.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}

// ---- Display helpers ---------------------------------------------------------

export function tmdbImage(path: string | null, size: "w92" | "w185" | "w342" = "w185"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function releaseYear(date: string | null): number | null {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year > 1800 ? year : null;
}
