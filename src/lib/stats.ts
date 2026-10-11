import { z } from "zod";
import { addDays } from "./dates";

// Per-device stats, kept in localStorage. No login, so they live and die with the device.

export const statsSchema = z.object({
  played: z.number().int().nonnegative().catch(0),
  totalLinks: z.number().int().nonnegative().catch(0),
  streak: z.number().int().nonnegative().catch(0),
  maxStreak: z.number().int().nonnegative().catch(0),
  lastSolvedDate: z.string().nullable().catch(null),
});
export type Stats = z.infer<typeof statsSchema>;

export const emptyStats: Stats = { played: 0, totalLinks: 0, streak: 0, maxStreak: 0, lastSolvedDate: null };

/** Tolerates missing, old or hand-edited storage: anything unreadable starts fresh. */
export function parseStats(raw: string | null): Stats {
  if (!raw) return emptyStats;
  try {
    const parsed = statsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyStats;
  } catch {
    return emptyStats;
  }
}

/** Counts a solve once per date. The streak continues only from yesterday's solve. */
export function recordSolve(stats: Stats, date: string, links: number): Stats {
  if (stats.lastSolvedDate === date) return stats;
  const streak = stats.lastSolvedDate === addDays(date, -1) ? stats.streak + 1 : 1;
  return {
    played: stats.played + 1,
    totalLinks: stats.totalLinks + links,
    streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    lastSolvedDate: date,
  };
}

/** The streak as of today: still alive if the last solve was today or yesterday. */
export function currentStreak(stats: Stats, today: string): number {
  if (!stats.lastSolvedDate) return 0;
  if (stats.lastSolvedDate === today || stats.lastSolvedDate === addDays(today, -1)) return stats.streak;
  return 0;
}

export function averageLinks(stats: Stats): number | null {
  return stats.played ? Math.round((stats.totalLinks / stats.played) * 10) / 10 : null;
}
