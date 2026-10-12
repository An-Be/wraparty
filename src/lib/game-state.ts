import { z } from "zod";
import { nodeId, type ChainNode } from "./chain";

// Today's game in one mode as saved on the device, so a reload picks up where you left off.

const nodeSchema = z.object({
  kind: z.enum(["entity", "via"]),
  id: nodeId,
  name: z.string(),
  meta: z.string().nullable().catch(null),
  img: z.string().nullable().catch(null),
});

const gameSchema = z.object({
  chain: z.array(nodeSchema).min(1),
  /** The solve was recorded in local stats. */
  counted: z.boolean().catch(false),
  /** The anonymous solve report reached the server. */
  reported: z.boolean().catch(false),
});

export type GameState = { chain: ChainNode[]; counted: boolean; reported: boolean };

export function freshGame(start: ChainNode): GameState {
  return { chain: [start], counted: false, reported: false };
}

/** Saved state for today's puzzle, or a fresh game if it's missing, broken or for another pair. */
export function parseGame(raw: string | null, start: ChainNode): GameState {
  if (!raw) return freshGame(start);
  try {
    const parsed = gameSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return freshGame(start);
    const first = parsed.data.chain[0];
    if (first.kind !== "entity" || first.id !== start.id) return freshGame(start);
    return parsed.data;
  } catch {
    return freshGame(start);
  }
}
