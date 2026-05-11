import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string }> };

async function verifyPlanOwner(planId: string, coachUserId: string) {
  return prisma.plan.findFirst({ where: { id: planId, coachUserId }, select: { id: true } });
}

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function periodFromStart(startDate: Date, now: Date, periodDays: number) {
  const start = startOfDayUTC(startDate).getTime();
  const current = startOfDayUTC(now).getTime();
  const diffDays = Math.floor((current - start) / 86_400_000);
  return Math.floor(diffDays / Math.max(1, periodDays)) + 1;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    const now = new Date();
    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: auth.user.sub },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: {
            workouts: {
              orderBy: { sortOrder: "asc" },
              include: {
                workoutTemplate: {
                  select: {
                    id: true,
                    title: true,
                    tags: true,
                    workoutExercises: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
        assignments: {
          where: { OR: [{ status: "active" }, { status: "paused" }] },
          include: {
            client: { select: { id: true, displayName: true, email: true } },
          },
        },
      },
    });

    if (!plan) return notFound("Plan not found");

    return ok({
      id: plan.id,
      title: plan.title,
      goal: plan.goal,
      notes: plan.notes,
      status: plan.status,
      weeksCount: plan.weeksCount,
      periodDays: plan.periodDays,
      weeks: plan.weeks.map((w) => ({
        id: w.id,
        weekNumber: w.weekNumber,
        title: w.title,
        notes: w.notes,
        workouts: w.workouts.map((pw) => ({
          id: pw.id,
          sortOrder: pw.sortOrder,
          progressionNote: pw.progressionNote ?? null,
          workoutTemplate: {
            id: pw.workoutTemplate.id,
            title: pw.workoutTemplate.title,
            tags: pw.workoutTemplate.tags,
            exerciseCount: pw.workoutTemplate.workoutExercises.length,
          },
        })),
      })),
      assignments: plan.assignments.map((a) => ({
        id: a.id,
        status: a.status,
        startDate: a.startDate ? startOfDayUTC(a.startDate).toISOString().slice(0, 10) : null,
        currentWeekNumber: a.startDate
          ? Math.max(1, Math.min(plan.weeksCount || 1, periodFromStart(a.startDate, now, plan.periodDays)))
          : 1,
        client: a.client,
      })),
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    if (!(await verifyPlanOwner(planId, auth.user.sub))) return forbidden();

    const activeAssignments = await prisma.planAssignment.count({
      where: { planId, status: "active" },
    });
    if (activeAssignments > 0)
      return forbidden("No se puede eliminar un plan con alumnos activos. Quitá el plan de los alumnos primero.");

    await prisma.plan.delete({ where: { id: planId } });
    return ok({ deleted: true });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    if (!(await verifyPlanOwner(planId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { title, goal, notes, status, weeksCount, periodDays } = body;

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(title !== undefined && { title }),
        ...(goal !== undefined && { goal }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(weeksCount !== undefined && { weeksCount }),
        ...(periodDays !== undefined && { periodDays }),
      },
      select: { id: true, title: true, goal: true, status: true, weeksCount: true, updatedAt: true },
    });

    return ok(updated);
  });
}
