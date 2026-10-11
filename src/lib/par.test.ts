import { describe, expect, it } from "vitest";
import { computePar, movieKey, personKey, type NodeKey } from "./par";

// A tiny film world. Credits are symmetric facts, so build edges both ways.
function world(credits: Record<number, number[]>) {
  const adj = new Map<NodeKey, NodeKey[]>();
  const add = (a: NodeKey, b: NodeKey) => adj.set(a, [...(adj.get(a) ?? []), b]);
  for (const [movie, people] of Object.entries(credits)) {
    for (const p of people) {
      add(movieKey(Number(movie)), personKey(p));
      add(personKey(p), movieKey(Number(movie)));
    }
  }
  let calls = 0;
  const neighbors = async (n: NodeKey) => {
    calls++;
    return adj.get(n) ?? [];
  };
  return { neighbors, calls: () => calls };
}

const opts = { maxPar: 4, budget: 1000 };

describe("computePar", () => {
  it("finds a direct co-star as par 1", async () => {
    const { neighbors } = world({ 100: [1, 2] });
    const r = await computePar(1, 2, neighbors, opts);
    expect(r).toMatchObject({ found: true, par: 1, path: ["p:1", "m:100", "p:2"] });
  });

  it("finds the shortest of several routes and returns a valid alternating path", async () => {
    // Long route 1-10-3-11-4-12-2 (par 3) and short route 1-20-5-21-2 (par 2).
    const { neighbors } = world({ 10: [1, 3], 11: [3, 4], 12: [4, 2], 20: [1, 5], 21: [5, 2] });
    const r = await computePar(1, 2, neighbors, opts);
    expect(r.found && r.par).toBe(2);
    if (!r.found) return;
    expect(r.path[0]).toBe("p:1");
    expect(r.path.at(-1)).toBe("p:2");
    expect(r.path).toHaveLength(5);
    r.path.forEach((k, i) => expect(k.startsWith(i % 2 === 0 ? "p:" : "m:")).toBe(true));
  });

  it("finds odd-length meets (par 3)", async () => {
    const { neighbors } = world({ 10: [1, 3], 11: [3, 4], 12: [4, 2] });
    const r = await computePar(1, 2, neighbors, opts);
    expect(r).toMatchObject({ found: true, par: 3, path: ["p:1", "m:10", "p:3", "m:11", "p:4", "m:12", "p:2"] });
  });

  it("reports too-far past maxPar", async () => {
    const { neighbors } = world({ 10: [1, 3], 11: [3, 4], 12: [4, 5], 13: [5, 2] });
    expect(await computePar(1, 2, neighbors, { ...opts, maxPar: 3 })).toMatchObject({ found: false, reason: "too-far" });
    expect(await computePar(1, 2, neighbors, opts)).toMatchObject({ found: true, par: 4 });
  });

  it("reports too-far when there is no connection at all", async () => {
    const { neighbors } = world({ 10: [1, 3], 11: [2, 4] });
    expect(await computePar(1, 2, neighbors, opts)).toMatchObject({ found: false, reason: "too-far" });
  });

  it("stops at the budget", async () => {
    const { neighbors, calls } = world({ 10: [1, 3], 11: [3, 4], 12: [4, 2] });
    expect(await computePar(1, 2, neighbors, { ...opts, budget: 2 })).toMatchObject({ found: false, reason: "budget" });
    expect(calls()).toBe(2);
  });
});
