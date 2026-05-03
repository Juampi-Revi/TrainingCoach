import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ sessionId: string; wseId: string }> };

async function resolveExercise(sessionId: string, wseId: string, clientUserId: string) {
  return prisma.workoutSessionExercise.findFirst({
    where: {
      id: wseId,
      workoutSessionId: sessionId,
      workoutSession: { clientUserId, status: "in_progress" },
    },
    select: { id: true },
  });
}

// POST /…/sets — append a new empty set
export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId, wseId } = await params;
    const se = await resolveExercise(sessionId, wseId, auth.user.sub);
    if (!se) return notFound("Exercise not found or session not in progress");

    const newSet = await prisma.$transaction(async (tx) => {
      const agg = await tx.workoutSet.aggregate({
        where: { workoutSessionExerciseId: se.id },
        _max: { setNumber: true },
      });
      const nextSetNumber = (agg._max.setNumber ?? 0) + 1;
      return tx.workoutSet.create({
        data: { workoutSessionExerciseId: se.id, setNumber: nextSetNumber },
        select: { id: true, setNumber: true },
      });
    });

    return ok({ id: newSet.id, setNumber: newSet.setNumber }, 201);
  });
}
