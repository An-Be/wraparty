import type { ModeCopy } from "./types";

// Movies: people joined by movies they acted in or directed (TMDB credits).
// Directing counts, so the copy says "acted in or directed" everywhere: "who
// else is in" read as cast only.
export const moviesCopy: ModeCopy = {
  slug: "movies",
  name: "Movies",
  labels: { entity: "person", entities: "people", via: "movie", vias: "movies" },
  howTo: "Connect them through movies. Each link is a movie two people were both in, acting or directing.",
  pickVia: (name) => `Pick a movie ${name} acted in or directed`,
  pickEntity: (title) => `Who acted in or directed ${title}?`,
  placeholder: { entity: "Search people", via: "Search movies" },
  hint: { entity: "Search any actor or director.", via: "Search any movie." },
  noMatches: "No matches on TMDB.",
  rejected: (code, name, title) =>
    code === "not-counted"
      ? `${name} only appears as themselves in ${title}. That doesn't count as a link.`
      : `${name} isn't credited in ${title}. Acting or directing only.`,
  finished: (name, title) => `${name} is credited in ${title}. That's a wrap!`,
};
