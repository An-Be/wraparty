import { db } from "@/lib/server/db";
import { json, notFound, rejectCrossSite } from "@/lib/server/http";
import { getSpaceByToken } from "@/lib/server/spaces";
import { newToken } from "@/lib/server/token";

type Ctx = { params: Promise<{ token: string }> };

// Replaces the secret link. The old URL stops working immediately (404).
export async function POST(req: Request, { params }: Ctx) {
  const blocked = rejectCrossSite(req, { hasBody: false });
  if (blocked) return blocked;

  const { token } = await params;
  const space = await getSpaceByToken(token);
  if (!space) return notFound();

  const updated = await db.space.update({
    where: { id: space.id },
    data: { token: newToken() },
    select: { token: true },
  });
  return json(updated);
}
