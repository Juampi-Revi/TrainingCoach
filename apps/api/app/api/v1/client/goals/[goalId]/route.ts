import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { notFound, ok, unauthorized, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ goalId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { goalId } = await params;

    const existing = await prisma.healthGoal.findFirst({
      where: { id: goalId, clientUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return notFound();

    await prisma.healthGoal.delete({ where: { id: goalId } });
    return ok({ id: goalId, deleted: true });
  });
}

