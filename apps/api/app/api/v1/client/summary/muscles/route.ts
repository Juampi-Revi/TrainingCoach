import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

    const sessions = await prisma.workoutSession.findMany({
      where: { clientUserId: auth.user.sub, performedAt: { gte: start, lt: endExclusive }, status: "completed" },
      select: {
        exercises: {
          select: {
            performedExercise: { select: { primaryMuscle: true } },
            sets: { select: { id: true } },
          },
        },
      },
    });

    const byMuscle = new Map<string, { muscle: string; sets: number; exercises: number }>();
    for (const s of sessions) {
      for (const ex of s.exercises) {
        const muscle = ex.performedExercise.primaryMuscle ?? "other";
        const sets = ex.sets.length;
        const prev = byMuscle.get(muscle) ?? { muscle, sets: 0, exercises: 0 };
        byMuscle.set(muscle, { muscle, sets: prev.sets + sets, exercises: prev.exercises + 1 });
      }
    }

    const items = Array.from(byMuscle.values()).sort((a, b) => b.sets - a.sets);

    return ok({
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days },
      items,
    });
  });
}
