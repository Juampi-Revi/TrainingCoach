import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { forbidden, ok, unauthorized, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ clientUserId: string }> };

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return forbidden();

    const sp = req.nextUrl.searchParams;
    const days = Math.min(30, Math.max(1, parseInt(sp.get("days") ?? "7", 10) || 7));

    const end = startOfDayUTC(new Date());
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    const endExclusive = new Date(end.getTime() + 86_400_000);

    const [healthEntries, foodCount, sessions, latestMetric] = await Promise.all([
      prisma.dailyHealthEntry.findMany({
        where: { clientUserId, day: { gte: start, lt: endExclusive } },
        select: { day: true, steps: true, sleepMinutes: true, sportMinutes: true, sportType: true },
        orderBy: { day: "asc" },
      }),
      prisma.foodLogEntry.count({
        where: { clientUserId, loggedAt: { gte: start, lt: endExclusive } },
      }),
      prisma.workoutSession.findMany({
        where: { clientUserId, performedAt: { gte: start, lt: endExclusive }, status: { not: "discarded" } },
        select: { status: true },
      }),
      prisma.bodyMetricEntry.findFirst({
        where: { clientUserId, weightKg: { not: null } },
        orderBy: { measuredAt: "desc" },
        select: { measuredAt: true, weightKg: true },
      }),
    ]);

    const sumSteps = healthEntries.reduce((acc, e) => acc + (e.steps ?? 0), 0);
    const sleepVals = healthEntries.map((e) => e.sleepMinutes).filter((v): v is number => typeof v === "number");
    const avgSleepMinutes = sleepVals.length ? Math.round(sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) : null;
    const sportMinutes = healthEntries.reduce((acc, e) => acc + (e.sportMinutes ?? 0), 0);

    const sessionsTotal = sessions.length;
    const sessionsCompleted = sessions.filter((s) => s.status === "completed").length;

    return ok({
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days },
      health: {
        daysWithEntry: healthEntries.length,
        stepsTotal: sumSteps,
        sleepAvgMinutes: avgSleepMinutes,
        sportMinutesTotal: sportMinutes,
      },
      food: { count: foodCount },
      workouts: { total: sessionsTotal, completed: sessionsCompleted },
      latestWeight: latestMetric?.weightKg ? { measuredAt: latestMetric.measuredAt.toISOString().slice(0, 10), weightKg: String(latestMetric.weightKg) } : null,
    });
  });
}

