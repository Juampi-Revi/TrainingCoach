import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function periodFromStart(startDate: Date, now: Date, periodDays: number) {
  const start = startOfDayUTC(startDate).getTime();
  const current = startOfDayUTC(now).getTime();
  const diffDays = Math.floor((current - start) / 86_400_000);
  return Math.floor(diffDays / Math.max(1, periodDays)) + 1;
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const clientUserId = auth.user.sub;
    const now = new Date();

    const assignment = await prisma.planAssignment.findFirst({
      where: {
        clientUserId,
        OR: [{ status: "active" }, { status: "paused" }],
      },
      include: {
        plan: {
          select: {
            id: true,
            title: true,
            status: true,
            weeksCount: true,
            periodDays: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assignment) {
      return ok({ plan: null, weekNumber: 0, totalWeeks: 0, days: [] });
    }

    const plan = assignment.plan;
    const totalWeeks = plan.weeksCount > 0 ? plan.weeksCount : 1;
    const rawWeek = assignment.startDate
      ? periodFromStart(assignment.startDate, now, plan.periodDays)
      : 1;
    const weekNumber = Math.max(1, Math.min(totalWeeks, rawWeek));

    const planWeek = await prisma.planWeek.findFirst({
      where: { planId: plan.id, weekNumber },
      include: {
        workouts: {
          orderBy: { sortOrder: "asc" },
          include: {
            workoutTemplate: {
              select: {
                id: true,
                title: true,
                description: true,
                tags: true,
                workoutExercises: { select: { id: true }, orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
      },
    });

    // Period window: [periodStart, periodStart + periodDays)
    const periodStart = assignment.startDate
      ? new Date(
          startOfDayUTC(assignment.startDate).getTime() +
            (weekNumber - 1) * plan.periodDays * 86_400_000,
        )
      : startOfDayUTC(now);
    const periodEnd = new Date(periodStart.getTime() + plan.periodDays * 86_400_000);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        clientUserId,
        performedAt: { gte: periodStart, lt: periodEnd },
        status: { not: "discarded" },
      },
      select: {
        id: true,
        workoutTemplateId: true,
        status: true,
        performedAt: true,
      },
    });

    const workouts = (planWeek?.workouts ?? []).map((pw) => {
      const tpl = pw.workoutTemplate;
      const session = sessions.find((s) => s.workoutTemplateId === tpl.id) ?? null;
      return {
        workoutTemplateId: tpl.id,
        title: tpl.title,
        description: tpl.description,
        tags: tpl.tags,
        exerciseCount: tpl.workoutExercises.length,
        session: session
          ? { id: session.id, status: session.status, performedAt: session.performedAt }
          : null,
      };
    });

    return ok({
      plan: { id: plan.id, title: plan.title },
      weekNumber,
      totalWeeks,
      assignmentStatus: assignment.status,
      workouts,
    });
  });
}
