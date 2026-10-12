import { z } from "zod";

// The chain a player builds, for any game mode: entity -> via -> entity -> ...
// -> target entity. In Movies, entities are people and vias are movies; in
// Music they'd be artists and collaborations. The engine never knows which:
// labels come from the mode (src/modes/), facts from its server adapter
// (src/lib/server/modes/). Shared by the chain builder and the API routes.

export type NodeKind = "entity" | "via";

/** One step in a chain. `meta` is a short qualifier, e.g. a movie's year. */
export type ChainNode = { kind: NodeKind; id: string; name: string; meta: string | null; img: string | null };

export type EntityRef = { id: string; name: string; img: string | null };

/** What a page hands the client about today's puzzle in one mode. */
export type PuzzleProps = {
  mode: string;
  date: string;
  number: number;
  par: number;
  entityA: EntityRef;
  entityB: EntityRef;
};

/** Singular and plural nouns for a mode's two node kinds, for generic copy. */
export type KindLabels = { entity: string; entities: string; via: string; vias: string };

/** Longest chain we accept. Far past any sensible par; caps validation work. */
export const MAX_LINKS = 12;

/** Links are the vias (movies) in the chain. */
export function linksOf(chain: readonly { kind: NodeKind }[]): number {
  return chain.filter((n) => n.kind === "via").length;
}

export function nextKind(chain: readonly ChainNode[]): NodeKind {
  return chain.at(-1)?.kind === "entity" ? "via" : "entity";
}

export function isSolved(chain: readonly ChainNode[], targetId: string): boolean {
  const last = chain.at(-1);
  return chain.length > 1 && last?.kind === "entity" && last.id === targetId;
}

/** A pick that's already in the chain goes nowhere new; say so instead of asking the server. */
export function repeatReason(
  chain: readonly ChainNode[],
  pick: { kind: NodeKind; id: string },
  labels: KindLabels,
): string | null {
  const seen = chain.find((n) => n.kind === pick.kind && n.id === pick.id);
  if (!seen) return null;
  return `${seen.name} is already in your chain. Pick another ${pick.kind === "entity" ? labels.entity : labels.via}.`;
}

// ---- Request schemas ---------------------------------------------------------

/** Source ids as text: TMDB numbers, MusicBrainz UUIDs, Wikidata Q-ids. */
export const nodeId = z
  .string({ error: "Pick from the list." })
  .regex(/^[A-Za-z0-9._:-]{1,64}$/, "Pick from the list.");

export const validateStepSchema = z.union(
  [z.object({ fromEntityId: nodeId, viaId: nodeId }), z.object({ viaId: nodeId, toEntityId: nodeId })],
  { error: "Pick from the list." },
);
export type ValidateStepBody = z.infer<typeof validateStepSchema>;

/**
 * not-linked: the entity isn't joined to the via at all.
 * not-counted: it is, but not in a way the mode counts (Movies: playing yourself).
 */
export type RejectCode = "not-linked" | "not-counted" | "not-found";

export type ValidateStepResult = { valid: true; node: ChainNode } | { valid: false; code: RejectCode; reason: string };

export const pathStepSchema = z.object({ kind: z.enum(["entity", "via"]), id: nodeId });
export type PathStep = z.infer<typeof pathStepSchema>;

export const solveSchema = z.object({
  deviceId: z.uuid({ error: "Missing device id." }),
  path: z
    .array(pathStepSchema, { error: "Missing path." })
    .min(3, "Your chain is too short.")
    .max(MAX_LINKS * 2 + 1, "Your chain is too long."),
});
export type SolveBody = z.infer<typeof solveSchema>;

/** Shape check for a submitted path: alternates entity/via, starts at A, ends at B. */
export function pathShapeError(path: readonly PathStep[], entityAId: string, entityBId: string): string | null {
  if (path.length % 2 === 0) return "Your chain has to end where it's going.";
  for (let i = 0; i < path.length; i++) {
    if (path[i].kind !== (i % 2 === 0 ? "entity" : "via")) return "Your chain is out of order.";
  }
  if (path[0].id !== entityAId) return "Your chain has to start with today's first pick.";
  if (path.at(-1)!.id !== entityBId) return "Your chain has to end with today's target.";
  const keys = new Set(path.map((s) => `${s.kind}:${s.id}`));
  if (keys.size !== path.length) return "Your chain repeats a step.";
  return null;
}
