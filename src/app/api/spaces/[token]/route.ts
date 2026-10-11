import { db } from "@/lib/server/db";
import { json, notFound, parseJsonBody, rejectCrossSite } from "@/lib/server/http";
import { getSpaceByToken } from "@/lib/server/spaces";
import { updateSpaceSchema } from "@/lib/spaces-schema";

type Ctx = { params: Promise<{ token: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;

  const { token } = await params;
  const space = await getSpaceByToken(token);
  if (!space) return notFound();

  const body = await parseJsonBody(req, updateSpaceSchema);
  if (!body.ok) return body.response;

  const updated = await db.space.update({
    where: { id: space.id },
    data: { title: body.data.title },
    select: { title: true },
  });
  return json(updated);
}
