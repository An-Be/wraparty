import { utcDateKey } from "@/lib/dates";
import { json, notFound } from "@/lib/server/http";
import { rejectIfClosed } from "@/lib/server/launch";
import { liveModeFrom } from "@/lib/server/modes";
import { getPuzzleForDate } from "@/lib/server/puzzles";

// Today's pair for one mode (?mode=movies), deterministic by UTC date. Pages
// render this on the server; the route exists for clients that want JSON.
export async function GET(req: Request) {
  const closed = rejectIfClosed();
  if (closed) return closed;

  const mode = await liveModeFrom(req);
  if (!mode) return notFound();

  const puzzle = await getPuzzleForDate(mode.id, utcDateKey());
  if (!puzzle) return notFound();
  return json({
    mode: mode.slug,
    date: puzzle.date,
    number: puzzle.number,
    par: puzzle.par,
    entityA: puzzle.entityA,
    entityB: puzzle.entityB,
  });
}
