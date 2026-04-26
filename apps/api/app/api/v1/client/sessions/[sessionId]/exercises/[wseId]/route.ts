import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ sessionId: string; wseId: string }> };

// PATCH — swap the performed exercise for an alternative
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId, wseId } = await params;

    const wse = await prisma.workoutSessionExercise.findFirst({
      where: { id: wseId, workoutSession: { id: sessionId, clientUserId: auth.user.sub } },
      select: { id: true },
    });
    if (!wse) return notFound("Ejercicio de sesión no encontrado");

    const body = await req.json().catch(() => ({}));
    const { swapExerciseId, swapReason } = body;
    if (!swapExerciseId) return err("swapExerciseId requerido", 400);

    const exercise = await prisma.exercise.findUnique({
      where: { id: swapExerciseId },
      select: { id: true, name: true, primaryMuscle: true, media: { take: 1, select: { url: true } } },
    });
    if (!exercise) return notFound("Ejercicio no encontrado");

    const updated = await prisma.workoutSessionExercise.update({
      where: { id: wseId },
      data: {
        performedExerciseId: swapExerciseId,
        swapReason: swapReason ?? "client_swap",
      },
    });

    return ok({
      id: updated.id,
      exercise: {
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        thumbnailUrl: exercise.media[0]?.url ?? null,
      },
    });
  });
}
