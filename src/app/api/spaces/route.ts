import { getClientIp } from "@/lib/server/client-ip";
import { db } from "@/lib/server/db";
import { json, parseJsonBody, rejectCrossSite, tooManyRequests } from "@/lib/server/http";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { newToken } from "@/lib/server/token";
import { createSpaceSchema } from "@/lib/spaces-schema";

// The canonical mutating route shape. Copy it for new routes:
// 1. CSRF guard  2. rate limit (if it costs anything)  3. validate  4. write  5. minimal response
export async function POST(req: Request) {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  const limit = await checkRateLimit(`space:create:${getClientIp(req)}`, { limit: 20, windowSeconds: 3600 });
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const body = await parseJsonBody(req, createSpaceSchema);
  if (!body.ok) return body.response;

  const space = await db.space.create({
    data: { token: newToken(), title: body.data.title },
    select: { token: true },
  });
  return json({ token: space.token }, 201);
}
