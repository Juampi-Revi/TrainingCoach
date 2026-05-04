import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, forbidden, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!template) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { exerciseId, workoutBlockId } = body;
    
    if (!exerciseId) return err("exerciseId requerido", 400);
    if (!workoutBlockId) return err("workoutBlockId requerido", 400);

    // Verify the block belongs to this workout template
    const block = await prisma.workoutBlock.findFirst({
      where: { id: workoutBlockId, workoutTemplateId },
    });
    if (!block) return err("Block not found or doesn't belong to this workout", 404);

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, OR: [{ isSystem: true }, { coachUserId: auth.user.sub }] },
      select: { id: true, name: true, primaryMuscle: true, equipment: true },
    });
    if (!exercise) return err("Ejercicio no encontrado", 404);

    // Get next sort order within the block
    const lastInBlock = await prisma.workoutExercise.findFirst({
      where: { workoutBlockId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSort = (lastInBlock?.sortOrder ?? -1) + 1;

    const we = await prisma.workoutExercise.create({
      data: {
        workoutTemplateId,
        workoutBlockId,
        exerciseId,
        sortOrder: nextSort,
        targetSets: body.targetSets ?? 3,
        targetReps: body.targetReps ?? "8-12",
        intensityType: body.intensityType ?? null,
        intensityTarget: body.intensityTarget ?? null,
        restSeconds: body.restSeconds ?? null,
        notes: body.notes ?? null,
      },
    });

    return ok({
      id: we.id,
      sortOrder: we.sortOrder,
      supersetGroup: we.supersetGroup,
      workoutBlockId: we.workoutBlockId,
      exercise,
      targetSets: we.targetSets,
      targetReps: we.targetReps,
      intensityType: we.intensityType,
      intensityTarget: we.intensityTarget ? String(we.intensityTarget) : null,
      restSeconds: we.restSeconds,
      notes: we.notes,
    }, 201);
  });
}
