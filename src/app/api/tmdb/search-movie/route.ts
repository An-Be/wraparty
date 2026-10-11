import { searchQuery } from "@/lib/search-schema";
import { getClientIp } from "@/lib/server/client-ip";
import { badRequest, json, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { searchMovies, tmdbUnavailable } from "@/lib/server/tmdb";

// Autocomplete proxy. The TMDB token stays on the server; the response carries
// only id, title, year and poster thumbnail. Bodyless GET: same-site check only.
export async function GET(req: Request) {
  const blocked = rejectCrossSite(req, { hasBody: false });
  if (blocked) return blocked;

  const limit = await checkRateLimit(`search:${getClientIp(req)}`, { limit: 120, windowSeconds: 60 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const q = searchQuery.safeParse(new URL(req.url).searchParams.get("q") ?? "");
  if (!q.success) return badRequest(q.error.issues[0]?.message ?? "Invalid search.");

  try {
    return json({ results: await searchMovies(q.data) });
  } catch (error) {
    return tmdbUnavailable(error);
  }
}
