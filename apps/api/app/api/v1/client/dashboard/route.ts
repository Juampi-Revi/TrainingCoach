import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    // Compute current week bounds: Monday 00:00 UTC to next Monday 00:00 UTC
    const now = new Date();
    const dayOfWeek = (now.getUTCDay() + 6) % 7; // Mon=0, Sun=6
    const weekStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek),
    );
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const clientUserId = auth.user.sub;

    // 1. Completed WorkoutSessions this week
    const sessions = await prisma.workoutSession.findMany({
      where: {
        clientUserId,
        status: "completed",
        performedAt: { gte: weekStart, lt: weekEnd },
      },
      select: { energyRating: true },
    });

    const workoutsCompleted = sessions.length;

    const sessionsWithEnergy = sessions.filter((s) => s.energyRating !== null);
    const energyAvg =
      sessionsWithEnergy.length > 0
        ? sessionsWithEnergy.reduce((sum, s) => sum + (s.energyRating as number), 0) /
          sessionsWithEnergy.length
        : null;

    // 2. DailyHealthEntry rows for this week
    const healthEntries = await prisma.dailyHealthEntry.findMany({
      where: {
        clientUserId,
        day: { gte: weekStart, lt: weekEnd },
      },
      select: { steps: true, sleepMinutes: true },
    });

    const entriesWithSteps = healthEntries.filter((e) => e.steps !== null);
    const stepsAvg =
      entriesWithSteps.length > 0
        ? entriesWithSteps.reduce((sum, e) => sum + (e.steps as number), 0) /
          entriesWithSteps.length
        : null;

    const entriesWithSleep = healthEntries.filter((e) => e.sleepMinutes !== null);
    const sleepMinutesAvg =
      entriesWithSleep.length > 0
        ? entriesWithSleep.reduce((sum, e) => sum + (e.sleepMinutes as number), 0) /
          entriesWithSleep.length
        : null;

    // 3. FoodLogEntry rows for this week
    const foodEntries = await prisma.foodLogEntry.findMany({
      where: {
        clientUserId,
        loggedAt: { gte: weekStart, lt: weekEnd },
      },
      select: { quality: true },
    });

    const foodGood = foodEntries.filter((f) => f.quality === "good").length;
    const foodRegular = foodEntries.filter((f) => f.quality === "regular").length;
    const foodPoor = foodEntries.filter((f) => f.quality === "poor").length;

    // 4. Active PlanAssignment with plan weeks
    const assignment = await prisma.planAssignment.findFirst({
      where: { clientUserId, status: { in: ["active", "paused"] } },
      select: {
        startDate: true,
        plan: {
          select: {
            weeks: {
              orderBy: { weekNumber: "asc" },
              select: {
                weekNumber: true,
                workouts: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    let workoutsTarget: number | null = null;

    if (assignment?.startDate) {
      const startDate = new Date(assignment.startDate);
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const elapsedMs = weekStart.getTime() - startDate.getTime();
      // 1-based week number the client is currently on
      const currentWeekNumber = Math.max(1, Math.floor(elapsedMs / msPerWeek) + 1);

      const planWeek = assignment.plan.weeks.find(
        (w) => w.weekNumber === currentWeekNumber,
      );

      if (planWeek) {
        workoutsTarget = planWeek.workouts.length;
      } else if (assignment.plan.weeks.length > 0) {
        // Fallback: use the last week if the plan has ended but assignment is still active
        const lastWeek = assignment.plan.weeks[assignment.plan.weeks.length - 1];
        workoutsTarget = lastWeek.workouts.length;
      }
    } else if (assignment) {
      // No startDate — use first week as target if available
      const firstWeek = assignment.plan.weeks[0];
      if (firstWeek) {
        workoutsTarget = firstWeek.workouts.length;
      }
    }

    // 5. Compute weekScore (0–100)
    let adherenceComponent = 0;
    if (workoutsTarget !== null && workoutsTarget > 0) {
      adherenceComponent = Math.min(60, (workoutsCompleted / workoutsTarget) * 60);
    }

    let energyComponent = 20; // default when no data
    if (energyAvg !== null) {
      energyComponent = Math.min(40, (energyAvg / 5) * 40);
    }

    const weekScore = Math.round(adherenceComponent + energyComponent);

    return ok({
      workoutsCompleted,
      workoutsTarget,
      energyAvg,
      stepsAvg,
      sleepMinutesAvg,
      foodGood,
      foodRegular,
      foodPoor,
      weekScore,
      weekStart,
      weekEnd,
    });
  });
}
