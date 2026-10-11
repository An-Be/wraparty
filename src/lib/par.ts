// Par = the shortest known chain between two people, in links (movies).
// Computed once per puzzle by scripts/seed-puzzles.ts, never at runtime.
//
// The graph is bipartite: person -> movie -> person. Nodes are keyed "p:<id>"
// and "m:<id>". Neighbors come from the bounded TMDB lists (top movies per
// person, top cast per movie), so every edge is a real credit and par is the
// shortest path we know of. Players validate against full credits, so they can
// sometimes beat it; that's what "Under par" is for.

export type NodeKey = `p:${number}` | `m:${number}`;
export type Neighbors = (node: NodeKey) => Promise<NodeKey[]>;

export type ParResult =
  | { found: true; par: number; path: NodeKey[]; expansions: number }
  | { found: false; reason: "too-far" | "budget"; expansions: number };

export type ParOptions = {
  /** Stop looking past this many links. */
  maxPar: number;
  /** Max neighbor lookups (each is one TMDB request when uncached). */
  budget: number;
};

export const personKey = (id: number): NodeKey => `p:${id}`;
export const movieKey = (id: number): NodeKey => `m:${id}`;

export function parseKey(key: NodeKey): { kind: "person" | "movie"; id: number } {
  return { kind: key.startsWith("p:") ? "person" : "movie", id: Number(key.slice(2)) };
}

type Side = {
  dist: Map<NodeKey, number>;
  parent: Map<NodeKey, NodeKey | null>;
  frontier: NodeKey[];
  depth: number;
};

function newSide(start: NodeKey): Side {
  return { dist: new Map([[start, 0]]), parent: new Map([[start, null]]), frontier: [start], depth: 0 };
}

function walk(parent: Map<NodeKey, NodeKey | null>, from: NodeKey): NodeKey[] {
  const out: NodeKey[] = [];
  let cur: NodeKey | null | undefined = from;
  while (cur) {
    out.push(cur);
    cur = parent.get(cur);
  }
  return out;
}

/**
 * Bidirectional BFS from both people, always expanding the smaller frontier one
 * full level at a time. Hops are counted per edge; links = hops / 2.
 */
export async function computePar(
  personA: number,
  personB: number,
  neighbors: Neighbors,
  { maxPar, budget }: ParOptions,
): Promise<ParResult> {
  const start = personKey(personA);
  const goal = personKey(personB);
  if (personA === personB) return { found: true, par: 0, path: [start], expansions: 0 };

  const fwd = newSide(start);
  const bwd = newSide(goal);
  const maxHops = maxPar * 2;
  let expansions = 0;
  let best: { hops: number; meet: NodeKey } | null = null;

  while (fwd.frontier.length && bwd.frontier.length) {
    // Any path still to be found is at least depth(fwd) + depth(bwd) + 1 hops.
    if (best && fwd.depth + bwd.depth + 1 >= best.hops) break;
    if (fwd.depth + bwd.depth + 1 > maxHops) break;

    const [side, other] = fwd.frontier.length <= bwd.frontier.length ? [fwd, bwd] : [bwd, fwd];
    const next: NodeKey[] = [];
    for (const node of side.frontier) {
      if (expansions >= budget) return { found: false, reason: "budget", expansions };
      expansions++;
      const d = side.dist.get(node)! + 1;
      for (const n of await neighbors(node)) {
        if (side.dist.has(n)) continue;
        side.dist.set(n, d);
        side.parent.set(n, node);
        next.push(n);
        const od = other.dist.get(n);
        if (od !== undefined && (!best || d + od < best.hops)) best = { hops: d + od, meet: n };
      }
    }
    side.frontier = next;
    side.depth++;
  }

  if (!best || best.hops > maxHops) return { found: false, reason: "too-far", expansions };
  const path = [...walk(fwd.parent, best.meet).reverse(), ...walk(bwd.parent, best.meet).slice(1)];
  return { found: true, par: best.hops / 2, path, expansions };
}
