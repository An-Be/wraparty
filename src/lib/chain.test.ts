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
  type KindLabels,
} from "./chain";

const labels: KindLabels = { entity: "person", entities: "people", via: "movie", vias: "movies" };
const streep: ChainNode = { kind: "entity", id: "5064", name: "Meryl Streep", meta: null, img: null };
const prada: ChainNode = { kind: "via", id: "350", name: "The Devil Wears Prada", meta: "2006", img: null };
const tucci: ChainNode = { kind: "entity", id: "2283", name: "Stanley Tucci", meta: null, img: null };

describe("chain helpers", () => {
  it("counts links and knows what comes next", () => {
    expect(linksOf([streep])).toBe(0);
    expect(nextKind([streep])).toBe("via");
    expect(nextKind([streep, prada])).toBe("entity");
    expect(linksOf([streep, prada, tucci])).toBe(1);
  });

  it("is solved only when the chain ends on the target", () => {
    expect(isSolved([streep, prada, tucci], "2283")).toBe(true);
    expect(isSolved([streep, prada], "350")).toBe(false);
    expect(isSolved([streep], "5064")).toBe(false);
  });

  it("explains repeats with the mode's nouns", () => {
    expect(repeatReason([streep, prada], { kind: "entity", id: "5064" }, labels)).toBe(
      "Meryl Streep is already in your chain. Pick another person.",
    );
    expect(repeatReason([streep, prada], { kind: "via", id: "350" }, labels)).toMatch(/another movie/);
    expect(repeatReason([streep, prada], { kind: "entity", id: "2283" }, labels)).toBeNull();
  });
});

describe("validateStepSchema", () => {
  it("accepts either step shape with text ids and strips extras", () => {
    expect(validateStepSchema.parse({ fromEntityId: "1", viaId: "2", isAdmin: true })).toEqual({ fromEntityId: "1", viaId: "2" });
    expect(validateStepSchema.parse({ viaId: "2", toEntityId: "Q42" })).toEqual({ viaId: "2", toEntityId: "Q42" });
    expect(
      validateStepSchema.parse({ viaId: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d", toEntityId: "3" }),
    ).toBeTruthy();
  });
  it("rejects junk", () => {
    expect(validateStepSchema.safeParse({ viaId: "2" }).success).toBe(false);
    expect(validateStepSchema.safeParse({ fromEntityId: 1, viaId: "2" }).success).toBe(false);
    expect(validateStepSchema.safeParse({ fromEntityId: "../x", viaId: "2" }).success).toBe(false);
    expect(validateStepSchema.safeParse({ fromEntityId: "", viaId: "2" }).success).toBe(false);
  });
});

describe("solveSchema + pathShapeError", () => {
  const path = [
    { kind: "entity", id: "1" },
    { kind: "via", id: "10" },
    { kind: "entity", id: "2" },
  ] as const;

  it("accepts a well-formed solve", () => {
    const body = solveSchema.parse({ deviceId: crypto.randomUUID(), path, links: 99 });
    expect(body).not.toHaveProperty("links");
    expect(pathShapeError(body.path, "1", "2")).toBeNull();
  });

  it("rejects bad device ids and lengths", () => {
    expect(solveSchema.safeParse({ deviceId: "nope", path }).success).toBe(false);
    expect(solveSchema.safeParse({ deviceId: crypto.randomUUID(), path: path.slice(0, 1) }).success).toBe(false);
  });

  it("checks shape, endpoints and repeats", () => {
    expect(pathShapeError(path.slice(0, 2), "1", "2")).toMatch(/end/);
    expect(pathShapeError([path[0], path[0], path[2]], "1", "2")).toMatch(/order/);
    expect(pathShapeError(path, "9", "2")).toMatch(/start/);
    expect(pathShapeError(path, "1", "9")).toMatch(/target/);
    expect(pathShapeError([...path, { kind: "via", id: "10" }, { kind: "entity", id: "2" }], "1", "2")).toMatch(/repeats/);
  });
});
