import { describe, expect, it } from "vitest";
import type { ChainNode } from "./chain";
import { freshGame, parseGame } from "./game-state";

const start: ChainNode = { kind: "entity", id: "1", name: "Meryl Streep", meta: null, img: null };

describe("parseGame", () => {
  it("starts fresh with nothing saved or junk saved", () => {
    expect(parseGame(null, start)).toEqual(freshGame(start));
    expect(parseGame("{nope", start)).toEqual(freshGame(start));
    expect(parseGame(JSON.stringify({ chain: [] }), start)).toEqual(freshGame(start));
  });

  it("restores a saved chain for the same pair", () => {
    const saved = {
      chain: [start, { kind: "via", id: "10", name: "X", meta: "2000", img: null }],
      counted: false,
      reported: false,
    };
    expect(parseGame(JSON.stringify(saved), start)).toEqual(saved);
  });

  it("ignores a chain that starts with someone else (puzzle changed)", () => {
    const saved = { chain: [{ ...start, id: "2" }], counted: true, reported: true };
    expect(parseGame(JSON.stringify(saved), start)).toEqual(freshGame(start));
  });

  it("starts fresh from a pre-modes save (old person/movie nodes)", () => {
    const old = { chain: [{ kind: "person", id: 1, name: "Meryl Streep", img: null }], counted: false, reported: false };
    expect(parseGame(JSON.stringify(old), start)).toEqual(freshGame(start));
  });
});
