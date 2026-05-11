import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string }> };

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;

    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: auth.user.sub },
      select: { id: true, title: true, weeksCount: true, periodDays: true },
    });
    if (!plan) return forbidden();

    const clientUserId = req.nextUrl.searchParams.get("clientUserId");
    const weekNumberParam = req.nextUrl.searchParams.get("weekNumber");
    const weekNumberParsed = weekNumberParam ? parseInt(weekNumberParam) : 1;
    if (!Number.isFinite(weekNumberParsed) || weekNumberParsed < 1) return err("weekNumber inválido", 400);

    const totalWeeks = plan.weeksCount > 0 ? plan.weeksCount : 1;
    const weekNumber = Math.max(1, Math.min(totalWeeks, weekNumberParsed));

    const assignment = clientUserId
      ? await prisma.planAssignment.findFirst({
          where: { planId: plan.id, clientUserId, OR: [{ status: "active" }, { status: "paused" }] },
          select: { id: true, status: true, startDate: true },
        })
      : null;

    if (clientUserId && !assignment) return err("El alumno no tiene este plan asignado", 400);

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
                workoutExercises: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    const periodStart = assignment?.startDate
      ? new Date(startOfDayUTC(assignment.startDate).getTime() + (weekNumber - 1) * plan.periodDays * 86_400_000)
      : null;
    const periodEnd = periodStart ? new Date(periodStart.getTime() + plan.periodDays * 86_400_000) : null;

    const sessions =
      clientUserId && periodStart && periodEnd
        ? await prisma.workoutSession.findMany({
            where: {
              clientUserId,
              performedAt: { gte: periodStart, lt: periodEnd },
              status: { not: "discarded" },
            },
            select: { id: true, workoutTemplateId: true, status: true, performedAt: true },
          })
        : [];

    const sessionsByTemplate = new Map<string, typeof sessions>();
    for (const s of sessions) {
      if (!s.workoutTemplateId) continue;
      const existing = sessionsByTemplate.get(s.workoutTemplateId) ?? [];
      existing.push(s);
      sessionsByTemplate.set(s.workoutTemplateId, existing);
    }

    const workouts = (planWeek?.workouts ?? []).map((pw) => {
      const tpl = pw.workoutTemplate;
      const templateSessions = sessionsByTemplate.get(tpl.id) ?? [];
      const session = templateSessions.shift() ?? null;
      return {
        pwwId: pw.id,
        workoutTemplateId: tpl.id,
        title: tpl.title,
        description: tpl.description,
        tags: tpl.tags,
        exerciseCount: tpl.workoutExercises.length,
        progressionNote: pw.progressionNote ?? null,
        session: session ? { id: session.id, status: session.status, performedAt: session.performedAt } : null,
      };
    });

    return ok({
      plan: { id: plan.id, title: plan.title },
      weekNumber,
      totalWeeks,
      assignmentStatus: assignment?.status ?? "active",
      workouts,
    });
  });
}
