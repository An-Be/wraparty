import "server-only";
import type { ChainNode, PathStep, ValidateStepBody, ValidateStepResult } from "@/lib/chain";
import { creditedPeople, releaseYear, tmdbImage, type MovieWithCredits } from "@/lib/tmdb";
import { getMovie } from "./tmdb";

// Facts, not vibes: every link is checked against TMDB credits (full lists, not
// the bounded par graph). Both step kinds reduce to "is this person credited
// in this movie?", so one cached /movie/{id}?append_to_response=credits call
// answers either.

function movieNode(movie: MovieWithCredits): ChainNode {
  return {
    kind: "movie",
    id: movie.id,
    title: movie.title,
    year: releaseYear(movie.release_date),
    img: tmdbImage(movie.poster_path, "w92"),
  };
}

function movieLabel(movie: MovieWithCredits): string {
  const year = releaseYear(movie.release_date);
  return year ? `${movie.title} (${year})` : movie.title;
}

function personNode(movie: MovieWithCredits, personId: number): ChainNode | null {
  const credit =
    movie.credits.cast.find((c) => c.id === personId) ?? movie.credits.crew.find((c) => c.id === personId);
  if (!credit) return null;
  return { kind: "person", id: credit.id, name: credit.name, img: tmdbImage(credit.profile_path, "w185") };
}

/** Listed in the cast, but only as themselves or via archive footage. */
function onlyAsSelf(movie: MovieWithCredits, personId: number): boolean {
  return movie.credits.cast.some((c) => c.id === personId);
}

function notCredited(movie: MovieWithCredits, personId: number): ValidateStepResult {
  if (onlyAsSelf(movie, personId)) {
    return {
      valid: false,
      code: "not-a-role",
      reason: `They only appear as themselves in ${movieLabel(movie)}. Links need an acting role or directing credit.`,
    };
  }
  return { valid: false, code: "not-credited", reason: `Not a credit: they aren't in the cast or directing ${movieLabel(movie)}.` };
}

export async function validateStep(body: ValidateStepBody): Promise<ValidateStepResult> {
  const movie = await getMovie(body.movieId);
  if (!movie) return { valid: false, code: "not-found", reason: "We couldn't find that movie on TMDB." };
  const people = creditedPeople(movie);

  if ("fromPersonId" in body) {
    if (!people.has(body.fromPersonId)) return notCredited(movie, body.fromPersonId);
    return { valid: true, node: movieNode(movie) };
  }

  if (!people.has(body.toPersonId)) return notCredited(movie, body.toPersonId);
  const node = personNode(movie, body.toPersonId);
  if (!node) return { valid: false, code: "not-found", reason: "We couldn't find that person on TMDB." };
  return { valid: true, node };
}

/**
 * Re-checks a submitted chain before it counts toward today's aggregates. The
 * shape (alternation, endpoints, repeats) is checked by pathShapeError first.
 */
export async function validatePath(path: readonly PathStep[]): Promise<string | null> {
  const movieIdx = path.flatMap((s, i) => (s.kind === "movie" ? [i] : []));
  const movies = await Promise.all(movieIdx.map((i) => getMovie(path[i].id)));
  for (let k = 0; k < movieIdx.length; k++) {
    const movie = movies[k];
    if (!movie) return "One of the movies in your chain doesn't exist.";
    const people = creditedPeople(movie);
    const i = movieIdx[k];
    if (!people.has(path[i - 1].id) || !people.has(path[i + 1].id)) {
      return `Your chain has a link that isn't a real credit (${movieLabel(movie)}).`;
    }
  }
  return null;
}
