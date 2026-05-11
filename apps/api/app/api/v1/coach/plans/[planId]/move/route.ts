import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, forbidden, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    const owner = await prisma.plan.findFirst({ where: { id: planId, coachUserId: auth.user.sub }, select: { id: true } });
    if (!owner) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { fromWeekNumber, fromSortOrder, toWeekNumber, toSortOrder } = body as Record<string, unknown>;

    if (
      typeof fromWeekNumber !== "number" ||
      typeof fromSortOrder !== "number" ||
      typeof toWeekNumber !== "number" ||
      typeof toSortOrder !== "number"
    ) {
      return err("fromWeekNumber/fromSortOrder/toWeekNumber/toSortOrder (number) requeridos", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const fromWeek = await tx.planWeek.findFirst({ where: { planId, weekNumber: fromWeekNumber }, select: { id: true } });
      if (!fromWeek) return { kind: "not_found" as const };

      const from = await tx.planWeekWorkout.findFirst({
        where: { planWeekId: fromWeek.id, sortOrder: fromSortOrder },
        select: { id: true, workoutTemplateId: true },
      });
      if (!from) return { kind: "not_found" as const };

      const toWeek = await tx.planWeek.findFirst({ where: { planId, weekNumber: toWeekNumber }, select: { id: true } });
      const ensuredToWeek = toWeek ?? (await tx.planWeek.create({ data: { planId, weekNumber: toWeekNumber }, select: { id: true } }));

      const to = await tx.planWeekWorkout.findFirst({
        where: { planWeekId: ensuredToWeek.id, sortOrder: toSortOrder },
        select: { id: true, workoutTemplateId: true },
      });

      if (!to) {
        await tx.planWeekWorkout.update({
          where: { id: from.id },
          data: { planWeekId: ensuredToWeek.id, sortOrder: toSortOrder },
        });
        return { kind: "moved" as const, fromId: from.id };
      }

      await tx.planWeekWorkout.update({
        where: { id: from.id },
        data: { planWeekId: ensuredToWeek.id, sortOrder: toSortOrder },
      });
      await tx.planWeekWorkout.update({
        where: { id: to.id },
        data: { planWeekId: fromWeek.id, sortOrder: fromSortOrder },
      });

      return { kind: "swapped" as const, fromId: from.id, toId: to.id };
    });

    if (result.kind === "not_found") return notFound("Celda origen no encontrada");

    return ok({ moved: true });
  });
}
