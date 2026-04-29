import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKeyUTC(date: Date) {
  return startOfDayUTC(date).toISOString().slice(0, 10);
}

function est1rm(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> },
) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;
    if (!exerciseId) return err("exerciseId required", 400);

    const sp = req.nextUrl.searchParams;
    const days = Math.min(365, Math.max(1, parseInt(sp.get("days") ?? "90", 10) || 90));

    const end = startOfDayUTC(new Date());
    const start = new Date(end.getTime() - (days - 1) * 86_400_000);
    const endExclusive = new Date(end.getTime() + 86_400_000);

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, name: true, primaryMuscle: true },
    });
    if (!exercise) return err("Exercise not found", 404);

    const sets = await prisma.workoutSet.findMany({
      where: {
        workoutSessionExercise: {
          performedExerciseId: exerciseId,
          workoutSession: {
            clientUserId: auth.user.sub,
            status: "completed",
            performedAt: { gte: start, lt: endExclusive },
          },
        },
        weight: { not: null },
        reps: { not: null },
      },
      select: {
        reps: true,
        weight: true,
        workoutSessionExercise: {
          select: {
            workoutSession: { select: { performedAt: true } },
          },
        },
      },
      take: 25_000,
    });

    const bestByDay = new Map<string, { day: string; bestWeight: number; bestReps: number; bestEst1rm: number }>();
    for (const s of sets) {
      const reps = typeof s.reps === "number" ? s.reps : null;
      const weight = s.weight != null ? parseFloat(String(s.weight)) : null;
      if (!reps || !weight) continue;
      const day = dayKeyUTC(s.workoutSessionExercise.workoutSession.performedAt);
      const e1 = est1rm(weight, reps);
      const prev = bestByDay.get(day);
      if (!prev || e1 > prev.bestEst1rm) {
        bestByDay.set(day, { day, bestWeight: weight, bestReps: reps, bestEst1rm: Math.round(e1 * 10) / 10 });
      }
    }

    const points = Array.from(bestByDay.values()).sort((a, b) => a.day.localeCompare(b.day));

    return ok({
      range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), days },
      exercise,
      points,
    });
  });
}
