import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const { id } = await params;

    const updated = await prisma.notification.updateMany({
      where: { id, userId: auth.user.sub, readAt: null },
      data: { readAt: new Date() },
    });

    if (updated.count === 0) return notFound("Notificación no encontrada o ya leída");

    return ok({ id, readAt: new Date().toISOString() });
  });
}
