import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string; weId: string }> };

async function verifyOwner(workoutTemplateId: string, weId: string, coachUserId: string) {
  return prisma.workoutExercise.findFirst({
    where: { id: weId, workoutTemplateId, workoutTemplate: { coachUserId } },
    select: { id: true },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    if (!(await verifyOwner(workoutTemplateId, weId, auth.user.sub))) return forbidden();

    const body = await req.json().catch(() => ({}));

    const updated = await prisma.workoutExercise.update({
      where: { id: weId },
      data: {
        ...(body.targetSets !== undefined && { targetSets: body.targetSets ? Number(body.targetSets) : null }),
        ...(body.targetReps !== undefined && { targetReps: body.targetReps || null }),
        ...(body.intensityType !== undefined && { intensityType: body.intensityType || null }),
        ...(body.intensityTarget !== undefined && { intensityTarget: body.intensityTarget ? Number(body.intensityTarget) : null }),
        ...(body.restSeconds !== undefined && { restSeconds: body.restSeconds ? Number(body.restSeconds) : null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
        ...(body.supersetGroup !== undefined && { supersetGroup: body.supersetGroup || null }),
        ...(body.isWarmup !== undefined && { isWarmup: Boolean(body.isWarmup) }),
      },
      include: { exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } } },
    });

    return ok({
      id: updated.id,
      sortOrder: updated.sortOrder,
      supersetGroup: updated.supersetGroup ?? null,
      isWarmup: updated.isWarmup ?? false,
      exercise: updated.exercise,
      targetSets: updated.targetSets,
      targetReps: updated.targetReps,
      intensityType: updated.intensityType,
      intensityTarget: updated.intensityTarget ? String(updated.intensityTarget) : null,
      restSeconds: updated.restSeconds,
      notes: updated.notes,
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    const we = await verifyOwner(workoutTemplateId, weId, auth.user.sub);
    if (!we) return notFound("Ejercicio no encontrado");

    await prisma.workoutExercise.delete({ where: { id: weId } });
    return ok({ deleted: true });
  });
}
