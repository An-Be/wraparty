import { z } from "zod";

// The chain a player builds: person -> movie -> person -> ... -> target person.
// Shared by the chain builder (client) and the API routes (validation).

export type PersonNode = { kind: "person"; id: number; name: string; img: string | null };
export type MovieNode = { kind: "movie"; id: number; title: string; year: number | null; img: string | null };
export type ChainNode = PersonNode | MovieNode;

/** What the page hands the client about today's puzzle. */
export type PuzzleProps = {
  date: string;
  number: number;
  par: number;
  personA: { id: number; name: string; img: string | null };
  personB: { id: number; name: string; img: string | null };
};

/** Longest chain we accept. Far past any sensible par; caps validation work. */
export const MAX_LINKS = 12;

/** Links are the movies in the chain. */
export function linksOf(chain: readonly { kind: ChainNode["kind"] }[]): number {
  return chain.filter((n) => n.kind === "movie").length;
}

export function nextKind(chain: readonly ChainNode[]): ChainNode["kind"] {
  return chain.at(-1)?.kind === "person" ? "movie" : "person";
}

export function isSolved(chain: readonly ChainNode[], targetId: number): boolean {
  const last = chain.at(-1);
  return chain.length > 1 && last?.kind === "person" && last.id === targetId;
}

export function nodeLabel(node: ChainNode): string {
  return node.kind === "person" ? node.name : node.title;
}

/** A pick that's already in the chain goes nowhere new; say so instead of asking the server. */
export function repeatReason(chain: readonly ChainNode[], pick: { kind: ChainNode["kind"]; id: number }): string | null {
  const seen = chain.find((n) => n.kind === pick.kind && n.id === pick.id);
  if (!seen) return null;
  return pick.kind === "person"
    ? `${nodeLabel(seen)} is already in your chain. Pick someone new.`
    : `${nodeLabel(seen)} is already in your chain. Pick another movie.`;
}

// ---- Request schemas ---------------------------------------------------------

const tmdbId = z.number({ error: "Pick from the list." }).int().positive().max(2_147_483_647);

export const validateStepSchema = z.union(
  [z.object({ fromPersonId: tmdbId, movieId: tmdbId }), z.object({ movieId: tmdbId, toPersonId: tmdbId })],
  { error: "Pick from the list." },
);
export type ValidateStepBody = z.infer<typeof validateStepSchema>;

export type ValidateStepResult =
  | { valid: true; node: ChainNode }
  | { valid: false; code: "not-credited" | "not-a-role" | "not-found"; reason: string };

export const pathStepSchema = z.object({ kind: z.enum(["person", "movie"]), id: tmdbId });
export type PathStep = z.infer<typeof pathStepSchema>;

export const solveSchema = z.object({
  deviceId: z.uuid({ error: "Missing device id." }),
  path: z
    .array(pathStepSchema, { error: "Missing path." })
    .min(3, "Your chain is too short.")
    .max(MAX_LINKS * 2 + 1, "Your chain is too long."),
});
export type SolveBody = z.infer<typeof solveSchema>;

/** Shape check for a submitted path: alternates person/movie, starts at A, ends at B. */
export function pathShapeError(path: readonly PathStep[], personAId: number, personBId: number): string | null {
  if (path.length % 2 === 0) return "Your chain has to end on a person.";
  for (let i = 0; i < path.length; i++) {
    if (path[i].kind !== (i % 2 === 0 ? "person" : "movie")) return "Your chain has to alternate people and movies.";
  }
  if (path[0].id !== personAId) return "Your chain has to start with today's first person.";
  if (path.at(-1)!.id !== personBId) return "Your chain has to end with today's second person.";
  const keys = new Set(path.map((s) => `${s.kind}:${s.id}`));
  if (keys.size !== path.length) return "Your chain repeats a step.";
  return null;
}
