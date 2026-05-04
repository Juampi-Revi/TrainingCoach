import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, err, withHandler } from "@/lib/api-response";
import { workoutExercisePatchSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ workoutTemplateId: string; weId: string }> };

async function verifyOwner(workoutTemplateId: string, weId: string, coachUserId: string) {
  return prisma.workoutExercise.findFirst({
    where: { id: weId, workoutTemplateId, workoutTemplate: { coachUserId } },
    select: { id: true, workoutBlockId: true },
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId, weId } = await params;
    const we = await verifyOwner(workoutTemplateId, weId, auth.user.sub);
    if (!we) return forbidden();

    const raw = await req.json().catch(() => ({}));

    const parsed = workoutExercisePatchSchema.safeParse(raw);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const body = parsed.data;

    // If moving to a different block, validate the new block exists
    if (body.workoutBlockId !== undefined && body.workoutBlockId !== we.workoutBlockId) {
      const block = await prisma.workoutBlock.findFirst({
        where: { id: body.workoutBlockId, workoutTemplateId },
      });
      if (!block) return err("Target block not found", 404);

      // If sortOrder not provided, place at the end of the new block
      if (body.sortOrder === undefined) {
        const lastInBlock = await prisma.workoutExercise.findFirst({
          where: { workoutBlockId: body.workoutBlockId },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        body.sortOrder = (lastInBlock?.sortOrder ?? -1) + 1;
      }
    }

    const updated = await prisma.workoutExercise.update({
      where: { id: weId },
      data: {
        ...(body.workoutBlockId !== undefined && { workoutBlockId: body.workoutBlockId }),
        ...(body.targetSets !== undefined && { targetSets: body.targetSets }),
        ...(body.targetReps !== undefined && { targetReps: body.targetReps }),
        ...(body.durationSeconds !== undefined && { durationSeconds: body.durationSeconds }),
        ...(body.intensityType !== undefined && { intensityType: body.intensityType }),
        ...(body.intensityTarget !== undefined && { intensityTarget: body.intensityTarget }),
        ...(body.restSeconds !== undefined && { restSeconds: body.restSeconds }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.supersetGroup !== undefined && { supersetGroup: body.supersetGroup }),
        ...(body.groupNote !== undefined && { groupNote: body.groupNote }),
      },
      include: { exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true } } },
    });

    return ok({
      id: updated.id,
      sortOrder: updated.sortOrder,
      supersetGroup: updated.supersetGroup ?? null,
      workoutBlockId: updated.workoutBlockId,
      exercise: updated.exercise,
      targetSets: updated.targetSets,
      targetReps: updated.targetReps,
      durationSeconds: updated.durationSeconds,
      intensityType: updated.intensityType,
      intensityTarget: updated.intensityTarget ? String(updated.intensityTarget) : null,
      restSeconds: updated.restSeconds,
      notes: updated.notes,
      groupNote: updated.groupNote ?? null,
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
