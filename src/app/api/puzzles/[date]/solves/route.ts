import { Prisma } from "@/lib/generated/prisma/client";
import { linksOf, pathShapeError, solveSchema } from "@/lib/chain";
import { isPlayableDate } from "@/lib/dates";
import { tierFor } from "@/lib/scoring";
import { getClientIp } from "@/lib/server/client-ip";
import { db } from "@/lib/server/db";
import { badRequest, json, notFound, parseJsonBody, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { getAggregates, getPuzzleForDate } from "@/lib/server/puzzles";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { tmdbUnavailable } from "@/lib/server/tmdb";
import { validatePath } from "@/lib/server/validate";
import { rejectIfClosed } from "@/lib/server/launch";

type Ctx = { params: Promise<{ date: string }> };

// Anonymous solve report: one row per device per date, feeding today's
// aggregates. Links and tier are computed here from the re-validated path, never
// taken from the client.
export async function POST(req: Request, { params }: Ctx) {
  const closed = rejectIfClosed();
  if (closed) return closed;

  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  const { date } = await params;
  if (!isPlayableDate(date)) return notFound();

  const limit = await checkRateLimit(`solve:${getClientIp(req)}`, { limit: 20, windowSeconds: 3600 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const body = await parseJsonBody(req, solveSchema);
  if (!body.ok) return body.response;

  const puzzle = await getPuzzleForDate(date);
  if (!puzzle) return notFound();

  const { deviceId, path } = body.data;
  const shapeError = pathShapeError(path, puzzle.personA.id, puzzle.personB.id);
  if (shapeError) return badRequest(shapeError);

  try {
    const pathError = await validatePath(path);
    if (pathError) return badRequest(pathError);
  } catch (error) {
    return tmdbUnavailable(error);
  }

  const links = linksOf(path);
  const vsPar = tierFor(links, puzzle.par);
  try {
    await db.solve.create({ data: { puzzleId: puzzle.id, date, deviceId, links, vsPar }, select: { id: true } });
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!duplicate) throw error;
    // Already reported from this device today: the first solve stands.
    const first = await db.solve.findUnique({
      where: { date_deviceId: { date, deviceId } },
      select: { links: true, vsPar: true },
    });
    return json({ ...first, aggregates: await getAggregates(date) }, 200);
  }

  return json({ links, vsPar, aggregates: await getAggregates(date) }, 201);
}
