// UTC calendar helpers. A puzzle "date" is a UTC yyyy-mm-dd string, so every
// player on Earth gets the same pair and it flips at midnight UTC.

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function utcDateKey(now: Date | number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  return utcDateKey(Date.parse(`${value}T00:00:00Z`)) === value;
}

function dayNumber(key: string): number {
  return Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

export function addDays(key: string, days: number): string {
  return utcDateKey((dayNumber(key) + days) * DAY_MS);
}

/** "10/09" for the share text. */
export function shareDateLabel(key: string): string {
  return `${key.slice(5, 7)}/${key.slice(8, 10)}`;
}

/** "Oct 9" for headings. */
export function displayDate(key: string): string {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function msUntilNextUtcMidnight(now: number = Date.now()): number {
  return DAY_MS - (now % DAY_MS);
}

/** "05:12:33" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * Which puzzle to use for a date with no row of its own (the curated list ran
 * out): cycle through the scheduled puzzles in date order, starting over from
 * the first. Dates that have their own row never move, however long the list grows.
 */
export function wrappedIndex(firstDate: string, date: string, count: number): number {
  if (count <= 0) return -1;
  const d = daysBetween(firstDate, date);
  return ((d % count) + count) % count;
}

/**
 * Dates a player may act on: today, plus yesterday so a game started just
 * before midnight UTC can still be finished and counted. No archive beyond that.
 */
export function isPlayableDate(date: string, now: number = Date.now()): boolean {
  if (!isDateKey(date)) return false;
  const diff = daysBetween(date, utcDateKey(now));
  return diff === 0 || diff === 1;
}
