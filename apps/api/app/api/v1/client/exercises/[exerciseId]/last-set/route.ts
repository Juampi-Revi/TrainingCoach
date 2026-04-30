import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

// GET /api/v1/client/exercises/[exerciseId]/last-set
// Returns the most recent set (with weight) for a given exercise from a completed session.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> },
) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { exerciseId } = await params;

    const set = await prisma.workoutSet.findFirst({
      where: {
        workoutSessionExercise: {
          performedExerciseId: exerciseId,
          workoutSession: {
            clientUserId: auth.user.sub,
            status: "completed",
          },
        },
        weight: { not: null },
      },
      orderBy: {
        workoutSessionExercise: {
          workoutSession: { performedAt: "desc" },
        },
      },
      select: {
        reps: true,
        weight: true,
        rpe: true,
        rir: true,
        notes: true,
        workoutSessionExercise: {
          select: {
            workoutSession: { select: { performedAt: true } },
          },
        },
      },
    });

    if (!set) return ok(null);

    return ok({
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      rir: set.rir,
      notes: set.notes,
      performedAt: set.workoutSessionExercise.workoutSession.performedAt,
    });
  });
}
