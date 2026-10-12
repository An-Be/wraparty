import "server-only";
import { isWellFormedSlug } from "@/modes";
import { db } from "../db";
import { moviesAdapter } from "./movies";
import type { ModeAdapter } from "./types";

// Adapters by mode slug. A mode is playable only when it has an adapter here
// AND its GameMode row is LIVE, so a half-built mode can't be reached early.
const adapters: Record<string, ModeAdapter> = {
  movies: moviesAdapter,
};

export type LiveMode = { id: string; slug: string; name: string; adapter: ModeAdapter };

export async function getLiveMode(slug: unknown): Promise<LiveMode | null> {
  if (!isWellFormedSlug(slug) || !Object.hasOwn(adapters, slug)) return null;
  const row = await db.gameMode.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, status: true } });
  if (!row || row.status !== "LIVE") return null;
  return { id: row.id, slug: row.slug, name: row.name, adapter: adapters[slug] };
}

/** For API routes: the mode named by ?mode=, or null (the route answers 404). */
export function liveModeFrom(req: Request): Promise<LiveMode | null> {
  return getLiveMode(new URL(req.url).searchParams.get("mode"));
}
