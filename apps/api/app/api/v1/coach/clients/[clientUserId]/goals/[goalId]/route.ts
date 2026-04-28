import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { forbidden, notFound, ok, unauthorized, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ clientUserId: string; goalId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId, goalId } = await params;
    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return forbidden();

    const existing = await prisma.healthGoal.findFirst({
      where: { id: goalId, clientUserId },
      select: { id: true },
    });
    if (!existing) return notFound();

    await prisma.healthGoal.delete({ where: { id: goalId } });
    return ok({ id: goalId, deleted: true });
  });
}

