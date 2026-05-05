import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, notFound, ok, unauthorized, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ goalId: string }> };

const GOAL_SELECT = {
  id: true,
  kind: true,
  targetInt: true,
  targetNumber: true,
  unit: true,
  period: true,
  startDate: true,
  endDate: true,
  shareWithCoach: true,
  createdAt: true,
} as const;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { goalId } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.healthGoal.findFirst({
      where: { id: goalId, clientUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return notFound();

    const data: Record<string, unknown> = {};
    if (typeof body.targetInt === "number") data.targetInt = Math.trunc(body.targetInt);
    if (typeof body.targetInt === "string") data.targetInt = Math.trunc(Number(body.targetInt));
    if (typeof body.targetNumber === "number") data.targetNumber = String(body.targetNumber);
    if (typeof body.targetNumber === "string") data.targetNumber = body.targetNumber;
    if (typeof body.shareWithCoach === "boolean") data.shareWithCoach = body.shareWithCoach;

    if (Object.keys(data).length === 0) return err("Nada que actualizar", 400);

    const updated = await prisma.healthGoal.update({
      where: { id: goalId },
      data,
      select: GOAL_SELECT,
    });

    return ok({
      ...updated,
      targetNumber: updated.targetNumber ? String(updated.targetNumber) : null,
      startDate: updated.startDate.toISOString(),
      endDate: updated.endDate ? updated.endDate.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    });
  });
}

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
