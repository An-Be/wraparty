import { describe, expect, it } from "vitest";
import {
  isCountableRole,
  isCreditedIn,
  movieWithCredits,
  personWithCredits,
  releaseYear,
  searchPersonResponse,
  tmdbImage,
  topCastIds,
  topMovieIds,
} from "./tmdb";

const movie = movieWithCredits.parse({
  id: 350,
  title: "The Devil Wears Prada",
  release_date: "2006-06-29",
  poster_path: "/p.jpg",
  extra: "dropped",
  credits: {
    cast: [
      { id: 2, name: "Anne Hathaway", character: "Andy Sachs", order: 1, profile_path: null },
      { id: 1, name: "Meryl Streep", character: "Miranda Priestly", order: 0, profile_path: "/m.jpg" },
      { id: 3, name: "Some Host", character: "Himself", order: 2, profile_path: null },
      { id: 4, name: "Old Star", character: "Self (archive footage)", order: 3, profile_path: null },
      { id: 5, name: "Extra", character: null, order: 20 },
    ],
    crew: [
      { id: 9, name: "David Frankel", job: "Director", profile_path: null },
      { id: 8, name: "Editor Person", job: "Editor", profile_path: null },
    ],
  },
});

describe("credit rules", () => {
  it("counts real roles and directors, not self or archive appearances", () => {
    expect(isCountableRole("Miranda Priestly")).toBe(true);
    expect(isCountableRole(null)).toBe(true);
    expect(isCountableRole("Herself - Host")).toBe(false);
    expect(isCountableRole("Self (archive footage)")).toBe(false);
    expect(isCreditedIn(movie, 1)).toBe(true);
    expect(isCreditedIn(movie, 9)).toBe(true);
    expect(isCreditedIn(movie, 3)).toBe(false);
    expect(isCreditedIn(movie, 8)).toBe(false);
    expect(isCreditedIn(movie, 777)).toBe(false);
  });

  it("bounds par edges to top billing plus directors", () => {
    expect(topCastIds(movie, 2)).toEqual([1, 2, 9]);
    expect(topCastIds(movie)).toEqual([1, 2, 5, 9]);
  });

  it("ranks a person's movies by popularity, deduped, skipping video releases", () => {
    const person = personWithCredits.parse({
      id: 1,
      name: "Meryl Streep",
      profile_path: null,
      movie_credits: {
        cast: [
          { id: 10, title: "A", character: "X", popularity: 5 },
          { id: 11, title: "B", character: "Y", popularity: 50 },
          { id: 12, title: "C", character: "Herself", popularity: 99 },
          { id: 13, title: "D", character: "Z", popularity: 70, video: true },
        ],
        crew: [
          { id: 10, title: "A", job: "Director", popularity: 5 },
          { id: 14, title: "E", job: "Director", popularity: 20 },
          { id: 15, title: "F", job: "Producer", popularity: 80 },
        ],
      },
    });
    expect(topMovieIds(person)).toEqual([11, 14, 10]);
    expect(topMovieIds(person, 1)).toEqual([11]);
  });
});

describe("schemas and helpers", () => {
  it("tolerates missing fields", () => {
    const r = searchPersonResponse.parse({ results: [{ id: 1, name: "X" }] });
    expect(r.results[0]).toEqual({ id: 1, name: "X", profile_path: null, known_for_department: null, popularity: 0 });
  });
  it("builds image URLs and years", () => {
    expect(tmdbImage("/a.jpg", "w92")).toBe("https://image.tmdb.org/t/p/w92/a.jpg");
    expect(tmdbImage(null)).toBeNull();
    expect(releaseYear("2006-06-29")).toBe(2006);
    expect(releaseYear("")).toBeNull();
    expect(releaseYear(null)).toBeNull();
  });
});
