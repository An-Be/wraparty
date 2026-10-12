import "server-only";
import type { ChainNode, PathStep, ValidateStepBody, ValidateStepResult } from "@/lib/chain";
import { creditedPeople, releaseYear, tmdbImage, type MovieWithCredits } from "@/lib/tmdb";
import { getMovie, searchMovies, searchPeople } from "../tmdb";
import type { ModeAdapter } from "./types";

// Movies mode: entities are TMDB people, vias are TMDB movies. Facts, not vibes:
// a link counts when TMDB credits the person in the movie as cast in a real
// role, or as director (rules in src/lib/tmdb.ts). Both step kinds reduce to
// "is this person credited in this movie?", so one cached
// /movie/{id}?append_to_response=credits call answers either.

/** TMDB ids are positive integers; anything else can't be a TMDB record. */
function tmdbId(id: string): number | null {
  return /^[1-9][0-9]{0,9}$/.test(id) && Number(id) <= 2_147_483_647 ? Number(id) : null;
}

function movieNode(movie: MovieWithCredits): ChainNode {
  const year = releaseYear(movie.release_date);
  return {
    kind: "via",
    id: String(movie.id),
    name: movie.title,
    meta: year ? String(year) : null,
    img: tmdbImage(movie.poster_path, "w92"),
  };
}

function movieLabel(movie: MovieWithCredits): string {
  const year = releaseYear(movie.release_date);
  return year ? `${movie.title} (${year})` : movie.title;
}

function personNode(movie: MovieWithCredits, personId: number): ChainNode | null {
  const credit = movie.credits.cast.find((c) => c.id === personId) ?? movie.credits.crew.find((c) => c.id === personId);
  if (!credit) return null;
  return { kind: "entity", id: String(credit.id), name: credit.name, meta: null, img: tmdbImage(credit.profile_path, "w185") };
}

function notCredited(movie: MovieWithCredits, personId: number): ValidateStepResult {
  // Listed in the cast, but only as themselves or via archive footage.
  if (movie.credits.cast.some((c) => c.id === personId)) {
    return {
      valid: false,
      code: "not-counted",
      reason: `They only appear as themselves in ${movieLabel(movie)}. Links need an acting role or directing credit.`,
    };
  }
  return { valid: false, code: "not-linked", reason: `Not a credit: they aren't in the cast or directing ${movieLabel(movie)}.` };
}

const notFound = (what: string): ValidateStepResult => ({
  valid: false,
  code: "not-found",
  reason: `We couldn't find that ${what} on TMDB.`,
});

export const moviesAdapter: ModeAdapter = {
  search(kind, query) {
    return kind === "entity" ? searchPeople(query) : searchMovies(query);
  },

  async validateStep(body: ValidateStepBody): Promise<ValidateStepResult> {
    const movieId = tmdbId(body.viaId);
    const movie = movieId ? await getMovie(movieId) : null;
    if (!movie) return notFound("movie");
    const people = creditedPeople(movie);

    if ("fromEntityId" in body) {
      const personId = tmdbId(body.fromEntityId);
      if (!personId) return notFound("person");
      if (!people.has(personId)) return notCredited(movie, personId);
      return { valid: true, node: movieNode(movie) };
    }

    const personId = tmdbId(body.toEntityId);
    if (!personId) return notFound("person");
    if (!people.has(personId)) return notCredited(movie, personId);
    const node = personNode(movie, personId);
    return node ? { valid: true, node } : notFound("person");
  },

  async validatePath(path: readonly PathStep[]): Promise<string | null> {
    const viaIdx = path.flatMap((s, i) => (s.kind === "via" ? [i] : []));
    const movies = await Promise.all(
      viaIdx.map((i) => {
        const id = tmdbId(path[i].id);
        return id ? getMovie(id) : Promise.resolve(null);
      }),
    );
    for (let k = 0; k < viaIdx.length; k++) {
      const movie = movies[k];
      if (!movie) return "One of the movies in your chain doesn't exist.";
      const people = creditedPeople(movie);
      const i = viaIdx[k];
      const before = tmdbId(path[i - 1].id);
      const after = tmdbId(path[i + 1].id);
      if (!before || !after || !people.has(before) || !people.has(after)) {
        return `Your chain has a link that isn't a real credit (${movieLabel(movie)}).`;
      }
    }
    return null;
  },
};
