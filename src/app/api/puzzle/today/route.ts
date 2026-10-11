import { utcDateKey } from "@/lib/dates";
import { json, notFound } from "@/lib/server/http";
import { getPuzzleForDate } from "@/lib/server/puzzles";
import { rejectIfClosed } from "@/lib/server/launch";

// Today's pair, deterministic by UTC date. The page renders this on the server;
// the route exists for clients that want it as JSON.
export async function GET() {
  const closed = rejectIfClosed();
  if (closed) return closed;

  const puzzle = await getPuzzleForDate(utcDateKey());
  if (!puzzle) return notFound();
  return json(puzzle);
}
