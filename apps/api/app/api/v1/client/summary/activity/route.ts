import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKeyUTC(date: Date) {
  return startOfDayUTC(date).toISOString().slice(0, 10);
}

function normalizeEnergyRating(energyRating: number | null): number | null {
  if (energyRating == null) return null;
  if (!Number.isFinite(energyRating)) return null;
  if (energyRating <= 0) return null;
  const v = energyRating <= 5 ? Math.round(energyRating) : Math.ceil(energyRating / 2);
  return Math.min(5, Math.max(1, v));
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const sp = req.nextUrl.searchParams;
    const days = Math.min(180, Math.max(1, parseInt(sp.get("days") ?? "30", 10) || 30));

    const end = startOfDayUTC(new Date());
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    const endExclusive = new Date(end.getTime() + 86_400_000);

    const [healthEntries, sessions] = await Promise.all([
      prisma.dailyHealthEntry.findMany({
        where: { clientUserId: auth.user.sub, day: { gte: start, lt: endExclusive } },
        select: { day: true, sportMinutes: true },
        orderBy: { day: "asc" },
      }),
      prisma.workoutSession.findMany({
        where: { clientUserId: auth.user.sub, performedAt: { gte: start, lt: endExclusive }, status: "completed" },
        select: { performedAt: true, energyRating: true },
        orderBy: { performedAt: "asc" },
      }),
    ]);

    const activeDays = new Set<string>();
    for (const e of healthEntries) {
      if ((e.sportMinutes ?? 0) > 0) activeDays.add(dayKeyUTC(e.day));
    }
    for (const s of sessions) {
      activeDays.add(dayKeyUTC(s.performedAt));
    }

    const sportMinutesTotal = healthEntries.reduce((acc, e) => acc + (e.sportMinutes ?? 0), 0);
    const energyVals = sessions
      .map((s) => normalizeEnergyRating(s.energyRating ?? null))
      .filter((v): v is number => typeof v === "number");
    const energyAvg = energyVals.length ? Math.round((energyVals.reduce((a, b) => a + b, 0) / energyVals.length) * 10) / 10 : null;

    return ok({
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days },
      activeDaysCount: activeDays.size,
      activeDays: Array.from(activeDays).sort(),
      sportMinutesTotal,
      sessionsCompleted: sessions.length,
      energyAvg,
      energyScale: 5,
    });
  });
}
