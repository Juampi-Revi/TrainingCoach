import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ clientUserId: string }> };

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
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
    const days = Math.min(30, Math.max(1, parseInt(sp.get("days") ?? "21", 10) || 21));

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400_000);
    const rangeStart = new Date(today.getTime() - (days - 1) * 86400_000);

    const [healthEntries, sessions, foodEntries, goals] = await Promise.all([
      prisma.dailyHealthEntry.findMany({
        where: { clientUserId, day: { gte: rangeStart, lt: tomorrow } },
        orderBy: { day: "desc" },
        select: { id: true, day: true, steps: true, sleepMinutes: true, notes: true },
      }),
      prisma.workoutSession.findMany({
        where: { clientUserId, status: "completed", performedAt: { gte: rangeStart, lt: tomorrow } },
        select: { id: true, performedAt: true },
      }),
      prisma.foodLogEntry.findMany({
        where: { clientUserId, loggedAt: { gte: rangeStart, lt: tomorrow } },
        orderBy: { loggedAt: "asc" },
        select: { id: true, loggedAt: true, mealType: true, quality: true, text: true },
      }),
      prisma.healthGoal.findMany({
        where: {
          clientUserId,
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
        select: { kind: true, targetInt: true, targetNumber: true, shareWithCoach: true },
      }),
    ]);

    // Index health entries by date key
    const healthByDate = new Map<string, typeof healthEntries[number]>();
    for (const e of healthEntries) healthByDate.set(toDateKey(e.day), e);

    // Count completed sessions per date key
    const sessionsByDate = new Map<string, number>();
    for (const s of sessions) {
      const key = toDateKey(s.performedAt);
      sessionsByDate.set(key, (sessionsByDate.get(key) ?? 0) + 1);
    }

    // Group food entries by date key
    const foodByDate = new Map<string, typeof foodEntries>();
    for (const f of foodEntries) {
      const key = toDateKey(f.loggedAt);
      const arr = foodByDate.get(key) ?? [];
      arr.push(f);
      foodByDate.set(key, arr);
    }

    // Build array newest → oldest covering every day in range
    const entries = Array.from({ length: days }, (_, i) => {
      const d = new Date(today.getTime() - i * 86400_000);
      const key = toDateKey(d);
      const h = healthByDate.get(key);
      const food = (foodByDate.get(key) ?? []).map((f) => ({
        id: f.id,
        mealType: f.mealType,
        quality: f.quality,
        text: f.text,
      }));
      return {
        date: key,
        steps: h?.steps ?? null,
        sleepMinutes: h?.sleepMinutes ?? null,
        workoutsCompleted: sessionsByDate.get(key) ?? 0,
        foodCount: food.length,
        notes: h?.notes ?? null,
        food,
      };
    });

    // Goals for coloring
    const stepsGoal = goals.find((g) => g.kind === "steps_daily");
    const sleepGoal = goals.find((g) => g.kind === "sleep_daily");

    const stepsTarget = stepsGoal?.targetInt ?? 8000;
    const sleepTargetMinutes = sleepGoal?.targetNumber
      ? Number(sleepGoal.targetNumber) * 60
      : 420;

    const shared =
      goals.length === 0 || goals.some((g) => g.shareWithCoach);

    return ok({
      entries,
      goalsForColoring: { stepsTarget, sleepTargetMinutes, shared },
    });
  });
}
