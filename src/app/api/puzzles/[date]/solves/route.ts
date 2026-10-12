import { Prisma } from "@/lib/generated/prisma/client";
import { linksOf, pathShapeError, solveSchema } from "@/lib/chain";
import { isPlayableDate } from "@/lib/dates";
import { tierFor } from "@/lib/scoring";
import { getClientIp } from "@/lib/server/client-ip";
import { db } from "@/lib/server/db";
import { badRequest, json, notFound, parseJsonBody, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { rejectIfClosed } from "@/lib/server/launch";
import { liveModeFrom } from "@/lib/server/modes";
import { sourceUnavailable } from "@/lib/server/modes/source";
import { getAggregates, getPuzzleForDate } from "@/lib/server/puzzles";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Ctx = { params: Promise<{ date: string }> };

// Anonymous solve report (?mode=movies): one row per device per mode per date,
// feeding that day's aggregates. Links and tier are computed here from the
// re-validated path, never taken from the client.
export async function POST(req: Request, { params }: Ctx) {
  const closed = rejectIfClosed();
  if (closed) return closed;

  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  const { date } = await params;
  if (!isPlayableDate(date)) return notFound();

  const limit = await checkRateLimit(`solve:${getClientIp(req)}`, { limit: 20, windowSeconds: 3600 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const mode = await liveModeFrom(req);
  if (!mode) return notFound();

  const body = await parseJsonBody(req, solveSchema);
  if (!body.ok) return body.response;

  const puzzle = await getPuzzleForDate(mode.id, date);
  if (!puzzle) return notFound();

  const { deviceId, path } = body.data;
  const shapeError = pathShapeError(path, puzzle.entityA.id, puzzle.entityB.id);
  if (shapeError) return badRequest(shapeError);

  try {
    const pathError = await mode.adapter.validatePath(path);
    if (pathError) return badRequest(pathError);
  } catch (error) {
    return sourceUnavailable(error);
  }

  const links = linksOf(path);
  const vsPar = tierFor(links, puzzle.par);
  try {
    await db.solve.create({
      data: { puzzleId: puzzle.id, modeId: mode.id, date, deviceId, links, vsPar },
      select: { id: true },
    });
  } catch (error) {
    const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!duplicate) throw error;
    // Already reported from this device today in this mode: the first solve stands.
    const first = await db.solve.findUnique({
      where: { modeId_date_deviceId: { modeId: mode.id, date, deviceId } },
      select: { links: true, vsPar: true },
    });
    return json({ ...first, aggregates: await getAggregates(mode.id, date) }, 200);
  }

  return json({ links, vsPar, aggregates: await getAggregates(mode.id, date) }, 201);
}
