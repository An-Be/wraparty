import { validateStepSchema } from "@/lib/chain";
import { isPlayableDate } from "@/lib/dates";
import { getClientIp } from "@/lib/server/client-ip";
import { json, notFound, parseJsonBody, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { rejectIfClosed } from "@/lib/server/launch";
import { liveModeFrom } from "@/lib/server/modes";
import { sourceUnavailable } from "@/lib/server/modes/source";
import { checkRateLimit } from "@/lib/server/rate-limit";

type Ctx = { params: Promise<{ date: string }> };

// Checks one link against the mode's source (?mode=movies). Writes nothing, but
// each call can cost an upstream request, so it gets the full mutating-route
// treatment.
export async function POST(req: Request, { params }: Ctx) {
  const closed = rejectIfClosed();
  if (closed) return closed;

  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  const { date } = await params;
  if (!isPlayableDate(date)) return notFound();

  const limit = await checkRateLimit(`step:${getClientIp(req)}`, { limit: 90, windowSeconds: 60 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const mode = await liveModeFrom(req);
  if (!mode) return notFound();

  const body = await parseJsonBody(req, validateStepSchema);
  if (!body.ok) return body.response;

  try {
    return json(await mode.adapter.validateStep(body.data));
  } catch (error) {
    return sourceUnavailable(error);
  }
}
