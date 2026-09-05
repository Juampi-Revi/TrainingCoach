import { prisma } from "@/lib/prisma";
import type { ClientWeekResponse, SessionStatus, WeekWorkout } from "@regen/types";
import { resolveSessionStatus, summarizeSessionProgress } from "./session-status";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function periodFromStart(startDate: Date, now: Date, periodDays: number) {
  const start = startOfDayUTC(startDate).getTime();
  const current = startOfDayUTC(now).getTime();
  const diffDays = Math.floor((current - start) / 86_400_000);
  return Math.floor(diffDays / Math.max(1, periodDays)) + 1;
}

export async function getClientWeek(args: { clientUserId: string; now?: Date }): Promise<ClientWeekResponse> {
  const now = args.now ?? new Date();

  const assignment = await prisma.planAssignment.findFirst({
    where: { clientUserId: args.clientUserId, OR: [{ status: "active" }, { status: "paused" }] },
    include: { plan: { select: { id: true, title: true, weeksCount: true, periodDays: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!assignment) {
    return { plan: null, weekNumber: 0, totalWeeks: 0, assignmentStatus: "active", workouts: [], mediaUrls: [] };
  }

  const plan = assignment.plan;
  const totalWeeks = plan.weeksCount > 0 ? plan.weeksCount : 1;
  const rawWeek = assignment.startDate ? periodFromStart(assignment.startDate, now, plan.periodDays) : 1;
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
              workoutExercises: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  exercise: {
                    select: {
                      media: {
                        select: { url: true },
                        take: 1,
                        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const periodStart = assignment.startDate
    ? new Date(startOfDayUTC(assignment.startDate).getTime() + (weekNumber - 1) * plan.periodDays * 86_400_000)
    : startOfDayUTC(now);
  const periodEnd = new Date(periodStart.getTime() + plan.periodDays * 86_400_000);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      clientUserId: args.clientUserId,
      performedAt: { gte: periodStart, lt: periodEnd },
      status: { not: "discarded" },
    },
    select: {
      id: true,
      workoutTemplateId: true,
      planWeekWorkoutId: true,
      status: true,
      performedAt: true,
      exercises: {
        select: {
          _count: { select: { sets: true } },
          workoutExercise: { select: { targetSets: true, workoutBlock: { select: { type: true } } } },
        },
      },
    },
  });

  const planWeekWorkoutIds = new Set((planWeek?.workouts ?? []).map((w) => w.id));

  const sessionsByPww = new Map<string, typeof sessions>();
  const unassigned: typeof sessions = [];
  for (const session of sessions) {
    const pwwId = session.planWeekWorkoutId;
    if (pwwId && planWeekWorkoutIds.has(pwwId)) {
      const existing = sessionsByPww.get(pwwId) ?? [];
      existing.push(session);
      sessionsByPww.set(pwwId, existing);
    } else {
      unassigned.push(session);
    }
  }

  const pickedByPww = new Map<string, (typeof sessions)[number]>();
  for (const [pwwId, list] of sessionsByPww) {
    const sorted = [...list].sort((a, b) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (b.status === "in_progress" && a.status !== "in_progress") return 1;
      return b.performedAt.getTime() - a.performedAt.getTime();
    });
    const best = sorted[0];
    if (best) pickedByPww.set(pwwId, best);
  }

  const sessionsByTemplate = new Map<string, typeof sessions>();
  for (const session of unassigned) {
    if (!session.workoutTemplateId) continue;
    const existing = sessionsByTemplate.get(session.workoutTemplateId) ?? [];
    existing.push(session);
    sessionsByTemplate.set(session.workoutTemplateId, existing);
  }

  const workouts: WeekWorkout[] = (planWeek?.workouts ?? []).map((pw) => {
    const tpl = pw.workoutTemplate;
    const direct = pickedByPww.get(pw.id) ?? null;
    const templateSessions = sessionsByTemplate.get(tpl.id) ?? [];
    const fallback = templateSessions.shift() ?? null;
    const session = direct ?? fallback;
    const summary = session ? summarizeSessionProgress(session.exercises) : null;
    const resolvedStatus = session && summary ? resolveSessionStatus(session.status, summary) : null;

    return {
      pwwId: pw.id,
      workoutTemplateId: tpl.id,
      title: tpl.title,
      description: tpl.description,
      tags: tpl.tags,
      exerciseCount: tpl.workoutExercises.length,
      progressionNote: pw.progressionNote ?? null,
      session: session
        ? {
            id: session.id,
            status: resolvedStatus as SessionStatus,
            performedAt: session.performedAt.toISOString(),
            setsCount: summary?.setsCount,
            targetSetsCount: summary?.targetSetsCount,
          }
        : null,
    };
  });

  const mediaUrls = [...new Set(
    (planWeek?.workouts ?? []).flatMap((pw) =>
      pw.workoutTemplate.workoutExercises
        .map((we) => we.exercise.media[0]?.url)
        .filter((url): url is string => !!url),
    ),
  )];

  return {
    plan: { id: plan.id, title: plan.title },
    weekNumber,
    totalWeeks,
    assignmentStatus: assignment.status as ClientWeekResponse["assignmentStatus"],
    workouts,
    mediaUrls,
  };
}
