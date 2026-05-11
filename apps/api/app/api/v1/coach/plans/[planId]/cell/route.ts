import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, forbidden, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string }> };

async function verifyOwner(planId: string, coachUserId: string) {
  return prisma.plan.findFirst({ where: { id: planId, coachUserId }, select: { id: true } });
}

// PUT: upsert a workout template into a plan cell (week × day)
export async function PUT(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    if (!(await verifyOwner(planId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { weekNumber, sortOrder, workoutTemplateId } = body;
    if (weekNumber == null || sortOrder == null || !workoutTemplateId)
      return err("weekNumber, sortOrder y workoutTemplateId son requeridos", 400);

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true, title: true, tags: true, workoutExercises: { select: { id: true } } },
    });
    if (!template) return notFound("Template no encontrado");

    // Find or create PlanWeek
    let week = await prisma.planWeek.findFirst({ where: { planId, weekNumber } });
    if (!week) {
      week = await prisma.planWeek.create({ data: { planId, weekNumber } });
    }

    // Upsert PlanWeekWorkout for this slot
    const existing = await prisma.planWeekWorkout.findFirst({
      where: { planWeekId: week.id, sortOrder },
      select: { id: true },
    });

    const pww = existing
      ? await prisma.planWeekWorkout.update({ where: { id: existing.id }, data: { workoutTemplateId } })
      : await prisma.planWeekWorkout.create({ data: { planWeekId: week.id, workoutTemplateId, sortOrder } });

    return ok({
      pwwId: pww.id,
      weekNumber,
      sortOrder,
      workoutTemplate: {
        id: template.id,
        title: template.title,
        tags: template.tags,
        exerciseCount: template.workoutExercises.length,
      },
    });
  });
}

// PATCH: update progressionNote of a cell (PlanWeekWorkout)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    if (!(await verifyOwner(planId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { pwwId, progressionNote } = body as { pwwId?: string; progressionNote?: string | null };
    if (!pwwId) return err("pwwId es requerido", 400);

    const existing = await prisma.planWeekWorkout.findFirst({
      where: { id: pwwId, planWeek: { planId } },
      select: { id: true },
    });
    if (!existing) return notFound("Celda no encontrada");

    const updated = await prisma.planWeekWorkout.update({
      where: { id: pwwId },
      data: { progressionNote: progressionNote ?? null },
      select: { id: true, progressionNote: true },
    });

    return ok({ pwwId: updated.id, progressionNote: updated.progressionNote ?? null });
  });
}

// DELETE: clear a cell
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    if (!(await verifyOwner(planId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { weekNumber, sortOrder } = body;
    if (weekNumber == null || sortOrder == null)
      return err("weekNumber y sortOrder son requeridos", 400);

    const week = await prisma.planWeek.findFirst({ where: { planId, weekNumber }, select: { id: true } });
    if (week) {
      await prisma.planWeekWorkout.deleteMany({ where: { planWeekId: week.id, sortOrder } });
    }

    return ok({ deleted: true });
  });
}
