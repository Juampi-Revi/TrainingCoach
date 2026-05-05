import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const clientUserId = auth.user.sub;
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [healthEntry, todaySessions, foodEntries] = await Promise.all([
      prisma.dailyHealthEntry.findUnique({
        where: { clientUserId_day: { clientUserId, day: todayStart } },
        select: { id: true, steps: true, sleepMinutes: true },
      }),
      prisma.workoutSession.findMany({
        where: {
          clientUserId,
          status: "completed",
          performedAt: { gte: todayStart, lt: tomorrowStart },
        },
        select: { id: true, energyRating: true },
      }),
      prisma.foodLogEntry.findMany({
        where: {
          clientUserId,
          loggedAt: { gte: todayStart, lt: tomorrowStart },
        },
        orderBy: { loggedAt: "asc" },
        select: { id: true, loggedAt: true, mealType: true, quality: true, text: true },
      }),
    ]);

    // Use the last session's energyRating (sessions ordered by insertion; filter nulls last)
    const sessionsWithEnergy = todaySessions.filter((s) => s.energyRating !== null);
    const energyRating =
      sessionsWithEnergy.length > 0
        ? sessionsWithEnergy[sessionsWithEnergy.length - 1].energyRating
        : null;

    const dateString = todayStart.toISOString().slice(0, 10);

    return ok({
      date: dateString,
      steps: healthEntry?.steps ?? null,
      sleepMinutes: healthEntry?.sleepMinutes ?? null,
      energyRating,
      workoutsToday: todaySessions.length,
      healthEntryId: healthEntry?.id ?? null,
      food: foodEntries.map((f) => ({
        id: f.id,
        loggedAt: f.loggedAt.toISOString(),
        mealType: f.mealType,
        quality: f.quality,
        text: f.text,
      })),
    });
  });
}
