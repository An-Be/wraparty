import "server-only";
import { daysBetween, wrappedIndex } from "@/lib/dates";
import type { DailyAggregates } from "@/lib/solve-types";
import { db } from "./db";

// Only ever select the fields a view needs; never pass whole rows to client components.
const publicFields = {
  id: true,
  date: true,
  personAId: true,
  personAName: true,
  personAImg: true,
  personBId: true,
  personBName: true,
  personBImg: true,
  par: true,
} as const;

export type PuzzleView = {
  id: string;
  /** The UTC date being played (may differ from the row's own date if the list wrapped). */
  date: string;
  /** "No. 12": days since the first scheduled puzzle, starting at 1. */
  number: number;
  par: number;
  personA: { id: number; name: string; img: string | null };
  personB: { id: number; name: string; img: string | null };
};

/**
 * The puzzle for a UTC date: its own row if one is scheduled, otherwise the
 * curated list wraps around (see wrappedIndex). Null only if no puzzles exist.
 */
export async function getPuzzleForDate(date: string): Promise<PuzzleView | null> {
  const first = await db.puzzle.findFirst({ orderBy: { date: "asc" }, select: { date: true } });
  if (!first) return null;

  let row = await db.puzzle.findUnique({ where: { date }, select: publicFields });
  if (!row) {
    const count = await db.puzzle.count();
    row = await db.puzzle.findFirst({
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
    personA: { id: row.personAId, name: row.personAName, img: row.personAImg },
    personB: { id: row.personBId, name: row.personBName, img: row.personBImg },
  };
}


export async function getAggregates(date: string): Promise<DailyAggregates> {
  const agg = await db.solve.aggregate({ where: { date }, _count: { _all: true }, _avg: { links: true } });
  const avg = agg._avg.links;
  return { solved: agg._count._all, averageLinks: avg == null ? null : Math.round(avg * 10) / 10 };
}
