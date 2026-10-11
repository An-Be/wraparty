import "server-only";
import { db } from "./db";
import { isWellFormedToken } from "./token";

// Only ever select the fields a view needs; never pass whole rows to client components.
const publicFields = { id: true, token: true, title: true } as const;

export type SpaceView = { id: string; token: string; title: string };

export async function getSpaceByToken(token: unknown): Promise<SpaceView | null> {
  if (!isWellFormedToken(token)) return null;
  return db.space.findUnique({ where: { token }, select: publicFields });
}
