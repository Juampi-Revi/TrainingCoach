import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { notFound, ok, unauthorized, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ metricId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { metricId } = await params;

    const existing = await prisma.bodyMetricEntry.findFirst({
      where: { id: metricId, clientUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return notFound();

    await prisma.bodyMetricEntry.delete({ where: { id: metricId } });
    return ok({ id: metricId, deleted: true });
  });
}
