import { z } from "zod";
import type { ChainNode, PersonNode } from "./chain";

// Today's game as saved on the device, so a reload picks up where you left off.

const nodeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("person"), id: z.number().int(), name: z.string(), img: z.string().nullable() }),
  z.object({
    kind: z.literal("movie"),
    id: z.number().int(),
    title: z.string(),
    year: z.number().int().nullable(),
    img: z.string().nullable(),
  }),
]);

const gameSchema = z.object({
  chain: z.array(nodeSchema).min(1),
  /** The solve was recorded in local stats. */
  counted: z.boolean().catch(false),
  /** The anonymous solve report reached the server. */
  reported: z.boolean().catch(false),
});

export type GameState = { chain: ChainNode[]; counted: boolean; reported: boolean };

export function freshGame(start: PersonNode): GameState {
  return { chain: [start], counted: false, reported: false };
}

/** Saved state for today's puzzle, or a fresh game if it's missing, broken or for another pair. */
export function parseGame(raw: string | null, start: PersonNode): GameState {
  if (!raw) return freshGame(start);
  try {
    const parsed = gameSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return freshGame(start);
    const first = parsed.data.chain[0];
    if (first.kind !== "person" || first.id !== start.id) return freshGame(start);
    return parsed.data;
  } catch {
    return freshGame(start);
  }
}
