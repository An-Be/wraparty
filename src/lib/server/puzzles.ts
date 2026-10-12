import "server-only";
import type { EntityRef } from "@/lib/chain";
import { daysBetween, wrappedIndex } from "@/lib/dates";
import type { DailyAggregates } from "@/lib/solve-types";
import { db } from "./db";

// Only ever select the fields a view needs; never pass whole rows to client components.
const publicFields = {
  id: true,
  entityAId: true,
  entityAName: true,
  entityAImg: true,
  entityBId: true,
  entityBName: true,
  entityBImg: true,
  par: true,
} as const;

export type PuzzleView = {
  id: string;
  /** The UTC date being played (may differ from the row's own date if the list wrapped). */
  date: string;
  /** "No. 12": days since this mode's first scheduled puzzle, starting at 1. */
  number: number;
  par: number;
  entityA: EntityRef;
  entityB: EntityRef;
};

/**
 * One mode's puzzle for a UTC date: its own row if one is scheduled, otherwise
 * that mode's curated list wraps around (see wrappedIndex). Null only if the
 * mode has no puzzles yet.
 */
export async function getPuzzleForDate(modeId: string, date: string): Promise<PuzzleView | null> {
  const first = await db.puzzle.findFirst({ where: { modeId }, orderBy: { date: "asc" }, select: { date: true } });
  if (!first) return null;

  let row = await db.puzzle.findUnique({ where: { modeId_date: { modeId, date } }, select: publicFields });
  if (!row) {
    const count = await db.puzzle.count({ where: { modeId } });
    row = await db.puzzle.findFirst({
      where: { modeId },
      orderBy: { date: "asc" },
      skip: wrappedIndex(first.date, date, count),
      select: publicFields,
    });
  }
  if (!row) return null;

  return {
    id: row.id,
    date,
    number: daysBetween(first.date, date) + 1,
    par: row.par,
    entityA: { id: row.entityAId, name: row.entityAName, img: row.entityAImg },
    entityB: { id: row.entityBId, name: row.entityBName, img: row.entityBImg },
  };
}

export async function getAggregates(modeId: string, date: string): Promise<DailyAggregates> {
  const agg = await db.solve.aggregate({
    where: { modeId, date },
    _count: { _all: true },
    _avg: { links: true },
  });
  const avg = agg._avg.links;
  return { solved: agg._count._all, averageLinks: avg == null ? null : Math.round(avg * 10) / 10 };
}

export type ModeCard = {
  slug: string;
  name: string;
  tagline: string;
  status: "LIVE" | "SOON";
  /** "live", "tuning up", "in rehearsal". */
  statusLabel: string;
  entityLabel: string;
  edgeLabel: string;
};

/** Every mode for the hub, live first by sortOrder. */
export function getModes(): Promise<ModeCard[]> {
  return db.gameMode.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { slug: true, name: true, tagline: true, status: true, statusLabel: true, entityLabel: true, edgeLabel: true },
  });
}

/** One mode's card, live or not, for /[mode]. */
export function getMode(slug: string): Promise<ModeCard | null> {
  return db.gameMode.findUnique({
    where: { slug },
    select: { slug: true, name: true, tagline: true, status: true, statusLabel: true, entityLabel: true, edgeLabel: true },
  });
}
