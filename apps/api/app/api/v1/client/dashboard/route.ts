import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import {
  getCurrentWeekBounds,
  getPreviousWeekBounds,
  calculateWeekScore,
  classifyWorkouts,
  calculateWeekTargets,
  calculateCurrentWeekNumber,
  buildDailyArrays,
  calculateAverages,
} from "@/lib/dashboard-calculations";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const clientUserId = auth.user.sub;
    const { start: weekStart, end: weekEnd } = getCurrentWeekBounds();
    const { start: prevWeekStart, end: prevWeekEnd } = getPreviousWeekBounds();

    // ─── Parallel queries for current week ─────────────────────────────────────
    const [
      sessionsWithTemplate,
      healthEntries,
      foodEntries,
      assignment,
      // Previous week data for trend
      prevWeekSessions,
      prevWeekHealth,
    ] = await Promise.all([
      // Current week sessions with template type
      prisma.workoutSession.findMany({
        where: {
          clientUserId,
          status: "completed",
          performedAt: { gte: weekStart, lt: weekEnd },
        },
        select: {
          energyRating: true,
          performedAt: true,
          workoutTemplate: { select: { type: true } },
        },
      }),
      // Current week health entries
      prisma.dailyHealthEntry.findMany({
        where: {
          clientUserId,
          day: { gte: weekStart, lt: weekEnd },
        },
        select: { day: true, steps: true, sleepMinutes: true },
      }),
      // Current week food entries
      prisma.foodLogEntry.findMany({
        where: {
          clientUserId,
          loggedAt: { gte: weekStart, lt: weekEnd },
        },
        select: { quality: true },
      }),
      // Plan assignment with weeks and workout types
      prisma.planAssignment.findFirst({
        where: { clientUserId, status: { in: ["active", "paused"] } },
        select: {
          startDate: true,
          plan: {
            select: {
              weeks: {
                orderBy: { weekNumber: "asc" },
                select: {
                  weekNumber: true,
                  workouts: {
                    select: { id: true, workoutTemplate: { select: { type: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      // Previous week sessions for trend calculation
      prisma.workoutSession.findMany({
        where: {
          clientUserId,
          status: "completed",
          performedAt: { gte: prevWeekStart, lt: prevWeekEnd },
        },
        select: { energyRating: true },
      }),
      // Previous week health entries for trend
      prisma.dailyHealthEntry.findMany({
        where: {
          clientUserId,
          day: { gte: prevWeekStart, lt: prevWeekEnd },
        },
        select: { steps: true, sleepMinutes: true },
      }),
    ]);

    // ─── Calculate current week metrics ────────────────────────────────────────

    const sessions = sessionsWithTemplate.map((s) => ({
      type: s.workoutTemplate?.type ?? "strength",
      energyRating: s.energyRating,
      performedAt: s.performedAt,
    }));

    const { strength: strengthCompleted, cardio: cardioCompleted } = classifyWorkouts(sessions);
    const workoutsCompleted = strengthCompleted + cardioCompleted;

    const { stepsAvg, sleepMinutesAvg, energyAvg } = calculateAverages(healthEntries, sessions);

    const { dailySteps, dailySleepMinutes, dailyEnergy } = buildDailyArrays(
      healthEntries,
      sessions,
      weekStart,
    );

    // ─── Calculate week number and targets ─────────────────────────────────────

    const weekNumber = assignment?.startDate
      ? calculateCurrentWeekNumber(assignment.startDate, weekStart)
      : 1;
    const totalWeeks = assignment?.plan.weeks.length ?? 1;

    const { totalTarget, strengthTarget, cardioTarget } = calculateWeekTargets(
      assignment
        ? {
            startDate: assignment.startDate,
            plan: {
              weeks: assignment.plan.weeks.map((w) => ({
                weekNumber: w.weekNumber,
                workouts: w.workouts.map((w) => ({
                  id: w.id,
                  type: w.workoutTemplate?.type ?? "strength",
                })),
              })),
            },
          }
        : null,
      weekNumber,
    );

    // ─── Calculate scores ──────────────────────────────────────────────────────

    const weekScore = calculateWeekScore(workoutsCompleted, totalTarget, energyAvg);

    // Previous week score for trend
    const prevEnergySessions = prevWeekSessions.filter((s) => s.energyRating !== null);
    const prevEnergyAvg =
      prevEnergySessions.length > 0
        ? prevEnergySessions.reduce((sum, s) => sum + (s.energyRating as number), 0) /
          prevEnergySessions.length
        : null;
    const previousWeekScore = prevWeekSessions.length > 0
      ? calculateWeekScore(prevWeekSessions.length, totalTarget, prevEnergyAvg)
      : null;

    // ─── Food counts ───────────────────────────────────────────────────────────

    const foodGood = foodEntries.filter((f) => f.quality === "good").length;
    const foodRegular = foodEntries.filter((f) => f.quality === "regular").length;
    const foodPoor = foodEntries.filter((f) => f.quality === "poor").length;

    return ok({
      weekStart,
      weekEnd,
      weekScore,
      weekNumber,
      totalWeeks,
      previousWeekScore,
      workoutsCompleted,
      workoutsTarget: totalTarget,
      strengthCompleted,
      strengthTarget,
      cardioCompleted,
      cardioTarget,
      energyAvg,
      stepsAvg,
      sleepMinutesAvg,
      dailySteps,
      dailySleepMinutes,
      dailyEnergy,
      foodGood,
      foodRegular,
      foodPoor,
    });
  });
}