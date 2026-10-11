import { validateStepSchema } from "@/lib/chain";
import { isPlayableDate } from "@/lib/dates";
import { getClientIp } from "@/lib/server/client-ip";
import { json, notFound, parseJsonBody, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { tmdbUnavailable } from "@/lib/server/tmdb";
import { validateStep } from "@/lib/server/validate";

type Ctx = { params: Promise<{ date: string }> };

// Checks one link against TMDB credits. Writes nothing, but each call can cost a
// TMDB request, so it gets the full mutating-route treatment.
export async function POST(req: Request, { params }: Ctx) {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  const { date } = await params;
  if (!isPlayableDate(date)) return notFound();

  const limit = await checkRateLimit(`step:${getClientIp(req)}`, { limit: 90, windowSeconds: 60 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const body = await parseJsonBody(req, validateStepSchema);
  if (!body.ok) return body.response;

  try {
    return json(await validateStep(body.data));
  } catch (error) {
    return tmdbUnavailable(error);
  }
}
