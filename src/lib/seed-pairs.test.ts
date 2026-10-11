import { describe, expect, it } from "vitest";
import { normalizeName, pairKey, parsePairsFile } from "./seed-pairs";

describe("parsePairsFile", () => {
  it("reads pairs, pinned ids, comments and blanks", () => {
    const { pairs, errors } = parsePairsFile(
      ["# comment", "", "Meryl Streep | Keanu Reeves", "Chris Evans [16828] |  Zendaya ", "oops", "a | b | c"].join("\n"),
    );
    expect(pairs).toEqual([
      { line: 3, a: { name: "Meryl Streep", id: null }, b: { name: "Keanu Reeves", id: null } },
      { line: 4, a: { name: "Chris Evans", id: 16828 }, b: { name: "Zendaya", id: null } },
    ]);
    expect(errors).toHaveLength(2);
  });
});

describe("helpers", () => {
  it("normalizes names and pairs", () => {
    expect(normalizeName("Penélope  Cruz")).toBe("penelope cruz");
    expect(normalizeName("Robert Downey Jr.")).toBe("robert downey jr");
    expect(pairKey(5, 2)).toBe(pairKey(2, 5));
  });
});
