import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function PATCH(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    await prisma.notification.updateMany({
      where: { userId: auth.user.sub, readAt: null },
      data: { readAt: new Date() },
    });

    return ok({ ok: true });
  });
}
