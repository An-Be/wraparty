import { describe, expect, it } from "vitest";
import {
  isSolved,
  linksOf,
  nextKind,
  pathShapeError,
  repeatReason,
  solveSchema,
  validateStepSchema,
  type ChainNode,
} from "./chain";

const streep: ChainNode = { kind: "person", id: 5064, name: "Meryl Streep", img: null };
const prada: ChainNode = { kind: "movie", id: 350, title: "The Devil Wears Prada", year: 2006, img: null };
const tucci: ChainNode = { kind: "person", id: 2283, name: "Stanley Tucci", img: null };

describe("chain helpers", () => {
  it("counts links and knows what comes next", () => {
    expect(linksOf([streep])).toBe(0);
    expect(nextKind([streep])).toBe("movie");
    expect(nextKind([streep, prada])).toBe("person");
    expect(linksOf([streep, prada, tucci])).toBe(1);
  });

  it("is solved only when the chain ends on the target", () => {
    expect(isSolved([streep, prada, tucci], 2283)).toBe(true);
    expect(isSolved([streep, prada], 350)).toBe(false);
    expect(isSolved([streep], 5064)).toBe(false);
  });

  it("explains repeats", () => {
    expect(repeatReason([streep, prada], { kind: "person", id: 5064 })).toMatch(/Meryl Streep is already/);
    expect(repeatReason([streep, prada], { kind: "movie", id: 350 })).toMatch(/another movie/);
    expect(repeatReason([streep, prada], { kind: "person", id: 2283 })).toBeNull();
  });
});

describe("validateStepSchema", () => {
  it("accepts either step shape and strips extras", () => {
    expect(validateStepSchema.parse({ fromPersonId: 1, movieId: 2, isAdmin: true })).toEqual({ fromPersonId: 1, movieId: 2 });
    expect(validateStepSchema.parse({ movieId: 2, toPersonId: 3 })).toEqual({ movieId: 2, toPersonId: 3 });
  });
  it("rejects junk", () => {
    expect(validateStepSchema.safeParse({ movieId: 2 }).success).toBe(false);
    expect(validateStepSchema.safeParse({ fromPersonId: "1", movieId: 2 }).success).toBe(false);
    expect(validateStepSchema.safeParse({ fromPersonId: -1, movieId: 2 }).success).toBe(false);
  });
});

describe("solveSchema + pathShapeError", () => {
  const path = [
    { kind: "person", id: 1 },
    { kind: "movie", id: 10 },
    { kind: "person", id: 2 },
  ] as const;

  it("accepts a well-formed solve", () => {
    const body = solveSchema.parse({ deviceId: crypto.randomUUID(), path, links: 99 });
    expect(body).not.toHaveProperty("links");
    expect(pathShapeError(body.path, 1, 2)).toBeNull();
  });

  it("rejects bad device ids and lengths", () => {
    expect(solveSchema.safeParse({ deviceId: "nope", path }).success).toBe(false);
    expect(solveSchema.safeParse({ deviceId: crypto.randomUUID(), path: path.slice(0, 1) }).success).toBe(false);
  });

  it("checks shape, endpoints and repeats", () => {
    expect(pathShapeError(path.slice(0, 2), 1, 2)).toMatch(/end on a person/);
    expect(pathShapeError([path[0], path[0], path[2]], 1, 2)).toMatch(/alternate/);
    expect(pathShapeError(path, 9, 2)).toMatch(/start/);
    expect(pathShapeError(path, 1, 9)).toMatch(/end with/);
    expect(
      pathShapeError([...path, { kind: "movie", id: 10 }, { kind: "person", id: 2 }], 1, 2),
    ).toMatch(/repeats/);
  });
});
