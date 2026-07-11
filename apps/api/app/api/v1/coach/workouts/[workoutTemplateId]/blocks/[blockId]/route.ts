import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";
import { mapWorkoutBlockStep, normalizeBlockSteps } from "@/lib/training/endurance";

type Ctx = { params: Promise<{ workoutTemplateId: string; blockId: string }> };

const INTERVAL_TYPES = ["tabata", "hiit", "emom", "amrap"] as const;

async function ownsTemplate(coachUserId: string, templateId: string) {
  return prisma.workoutTemplate.findFirst({
    where: { id: templateId, coachUserId },
    select: { id: true },
  });
}

// PATCH /coach/workouts/[id]/blocks/[blockId]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId, blockId } = await params;
    const t = await ownsTemplate(auth.user.sub, workoutTemplateId);
    if (!t) return forbidden("Not your template");

    const body = await req.json().catch(() => ({}));
    const {
      label,
      isExtra,
      roleLabel,
      effortLabel,
      executionLabel,
      description,
      restAfterSeconds,
      // Interval-specific
      intervalType,
      prepareSeconds,
      workSeconds,
      restSeconds,
      rounds,
      setCount,
      restBetweenSetsSeconds,
      intervalExerciseStrategy,
      totalDurationSeconds,
      restBetweenExercisesSeconds,
      // Cardio-specific
      targetMinutes,
      targetZone,
      steps,
    } = body;

    // Get existing block to check type
    const existing = await prisma.workoutBlock.findFirst({
      where: { id: blockId, workoutTemplateId },
    });
    if (!existing) return err("Block not found", 404);

    // Validate intervalType if changing
    if (intervalType !== undefined && existing.type === "intervals") {
      if (!INTERVAL_TYPES.includes(intervalType)) {
        return err(`intervalType must be one of: ${INTERVAL_TYPES.join(", ")}`, 400);
      }
    }

    const normalizedSteps = normalizeBlockSteps(steps);
    if (normalizedSteps.error) return err(normalizedSteps.error, 400);

    const block = await prisma.$transaction(async (tx) => {
      if (steps !== undefined) {
        await tx.workoutBlockStep.deleteMany({ where: { workoutBlockId: blockId } });
      }
      return tx.workoutBlock.update({
        where: { id: blockId },
        data: {
          label: label !== undefined ? label || null : undefined,
          isExtra: isExtra !== undefined ? !!isExtra : undefined,
          roleLabel: roleLabel !== undefined ? roleLabel || null : undefined,
          effortLabel: effortLabel !== undefined ? effortLabel || null : undefined,
          executionLabel: executionLabel !== undefined ? executionLabel || null : undefined,
          description: description !== undefined ? description || null : undefined,
          restAfterSeconds:
            restAfterSeconds !== undefined ? Number(restAfterSeconds) || null : undefined,
          // Interval-specific
          intervalType:
            intervalType !== undefined && existing.type === "intervals"
              ? intervalType
              : undefined,
          prepareSeconds:
            prepareSeconds !== undefined ? Number(prepareSeconds) || null : undefined,
          workSeconds: workSeconds !== undefined ? Number(workSeconds) || null : undefined,
          restSeconds: restSeconds !== undefined ? Number(restSeconds) || null : undefined,
          rounds: rounds !== undefined ? Number(rounds) || null : undefined,
          setCount: setCount !== undefined ? Number(setCount) || null : undefined,
          restBetweenSetsSeconds:
            restBetweenSetsSeconds !== undefined
              ? Number(restBetweenSetsSeconds) || null
              : undefined,
          intervalExerciseStrategy:
            intervalExerciseStrategy !== undefined
              ? intervalExerciseStrategy || null
              : undefined,
          totalDurationSeconds:
            totalDurationSeconds !== undefined
              ? Number(totalDurationSeconds) || null
              : undefined,
          restBetweenExercisesSeconds:
            restBetweenExercisesSeconds !== undefined
              ? Number(restBetweenExercisesSeconds) || null
              : undefined,
          // Cardio-specific
          targetMinutes:
            targetMinutes !== undefined ? Number(targetMinutes) || null : undefined,
          targetZone: targetZone !== undefined ? targetZone || null : undefined,
          steps:
            steps !== undefined
              ? {
                  create: normalizedSteps.steps,
                }
              : undefined,
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });
    });

    return ok({
      ...block,
      isExtra: block.isExtra,
      labels: {
        role: block.roleLabel,
        effort: block.effortLabel,
        execution: block.executionLabel,
      },
      steps: block.steps.map(mapWorkoutBlockStep),
    });
  });
}

// DELETE /coach/workouts/[id]/blocks/[blockId]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { workoutTemplateId, blockId } = await params;
    const t = await ownsTemplate(auth.user.sub, workoutTemplateId);
    if (!t) return forbidden("Not your template");

    // Check if block exists and belongs to this template
    const block = await prisma.workoutBlock.findFirst({
      where: { id: blockId, workoutTemplateId },
      include: { _count: { select: { exercises: true } } },
    });
    if (!block) return err("Block not found", 404);

    // Delete block (exercises will be cascade deleted)
    await prisma.workoutBlock.delete({ where: { id: blockId } });

    // Re-sort remaining blocks
    const remaining = await prisma.workoutBlock.findMany({
      where: { workoutTemplateId },
      orderBy: { sortOrder: "asc" },
    });

    await prisma.$transaction(
      remaining.map((b, index) =>
        prisma.workoutBlock.update({
          where: { id: b.id },
          data: { sortOrder: index },
        })
      )
    );

    return ok({ deleted: true });
  });
}
