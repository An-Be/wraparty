import { searchKind, searchQuery } from "@/lib/search-schema";
import { getClientIp } from "@/lib/server/client-ip";
import { badRequest, json, notFound, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { rejectIfClosed } from "@/lib/server/launch";
import { liveModeFrom } from "@/lib/server/modes";
import { sourceUnavailable } from "@/lib/server/modes/source";
import { checkRateLimit } from "@/lib/server/rate-limit";

// Autocomplete for any live mode: GET /api/search?mode=movies&kind=entity&q=...
// The source's key stays on the server; results carry only id, name, a short
// qualifier and a thumbnail. Bodyless GET: same-site check only.
export async function GET(req: Request) {
  const closed = rejectIfClosed();
  if (closed) return closed;

  const blocked = rejectCrossSite(req, { hasBody: false });
  if (blocked) return blocked;

  const limit = await checkRateLimit(`search:${getClientIp(req)}`, { limit: 120, windowSeconds: 60 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const mode = await liveModeFrom(req);
  if (!mode) return notFound();

  const params = new URL(req.url).searchParams;
  const kind = searchKind.safeParse(params.get("kind"));
  if (!kind.success) return badRequest(kind.error.issues[0]?.message ?? "Unknown search.");
  const q = searchQuery.safeParse(params.get("q") ?? "");
  if (!q.success) return badRequest(q.error.issues[0]?.message ?? "Invalid search.");

  try {
    return json({ results: await mode.adapter.search(kind.data, q.data) });
  } catch (error) {
    return sourceUnavailable(error);
  }
}
