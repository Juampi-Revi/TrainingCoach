import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";
import { mapWorkoutBlockStep } from "@/lib/training/endurance";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      include: {
        workoutBlocks: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { exercises: true } },
            steps: { orderBy: { sortOrder: "asc" } },
          },
        },
        workoutExercises: {
          orderBy: { sortOrder: "asc" },
          include: {
            exercise: { select: { id: true, name: true, primaryMuscle: true, equipment: true, youtubeUrl: true, isSystem: true } },
            _count: { select: { alternatives: true } },
          },
        },
      },
    });

    if (!template) return notFound("Workout template not found");

    return ok({
      id: template.id,
      title: template.title,
      description: template.description,
      tags: template.tags,
      type: template.type,
      sport: template.sport,
      blocks: template.workoutBlocks.map((b) => ({
        id: b.id,
        type: b.type,
        label: b.label,
        isExtra: b.isExtra,
        labels: {
          role: b.roleLabel,
          effort: b.effortLabel,
          execution: b.executionLabel,
        },
        description: b.description,
        sortOrder: b.sortOrder,
        restAfterSeconds: b.restAfterSeconds,
        intervalType: b.intervalType,
        prepareSeconds: b.prepareSeconds,
        workSeconds: b.workSeconds,
        restSeconds: b.restSeconds,
        rounds: b.rounds,
        setCount: b.setCount,
        restBetweenSetsSeconds: b.restBetweenSetsSeconds,
        intervalExerciseStrategy: b.intervalExerciseStrategy,
        totalDurationSeconds: b.totalDurationSeconds,
        restBetweenExercisesSeconds: b.restBetweenExercisesSeconds,
        targetMinutes: b.targetMinutes,
        targetZone: b.targetZone,
        exerciseCount: b._count.exercises,
        steps: b.steps.map(mapWorkoutBlockStep),
      })),
      exercises: template.workoutExercises.map((we) => ({
        id: we.id,
        sortOrder: we.sortOrder,
        supersetGroup: we.supersetGroup,
        workoutBlockId: we.workoutBlockId,
        exercise: we.exercise,
        targetSets: we.targetSets,
        targetReps: we.targetReps,
        durationSeconds: we.durationSeconds,
        labels: {
          role: we.roleLabel,
          effort: we.effortLabel,
          execution: we.executionLabel,
        },
        intensityType: we.intensityType,
        intensityTarget: we.intensityTarget ? String(we.intensityTarget) : null,
        restSeconds: we.restSeconds,
        notes: we.notes,
        groupNote: we.groupNote ?? null,
        groupIsExtra: we.groupIsExtra,
        groupLabels: {
          role: we.groupRoleLabel,
          effort: we.groupEffortLabel,
          execution: we.groupExecutionLabel,
        },
        alternativesCount: we._count.alternatives,
      })),
    });
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;
    const existing = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return forbidden();

    await prisma.workoutTemplate.delete({ where: { id: workoutTemplateId } });
    return ok({ deleted: true });
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const existing = await prisma.workoutTemplate.findFirst({
      where: { id: workoutTemplateId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!existing) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { title, description, tags, type, sport } = body;

    const updated = await prisma.workoutTemplate.update({
      where: { id: workoutTemplateId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(type !== undefined && { type }),
        ...(sport !== undefined && { sport }),
      },
      select: { id: true, title: true, description: true, tags: true, type: true, sport: true, updatedAt: true },
    });

    const recipients = await prisma.planAssignment.findMany({
      where: {
        status: { in: ["active", "paused"] },
        plan: {
          coachUserId: auth.user.sub,
          weeks: {
            some: {
              workouts: {
                some: { workoutTemplateId },
              },
            },
          },
        },
      },
      select: { clientUserId: true },
    });

    const uniqueClientIds = Array.from(new Set(recipients.map((r) => r.clientUserId)));
    await Promise.all(
      uniqueClientIds.map((clientUserId) =>
        notify({
          userId: clientUserId,
          type: "workout_modified",
          title: "Tu coach actualizó un entrenamiento",
          body: updated.title,
          linkUrl: "/semana",
        }),
      ),
    );

    return ok(updated);
  });
}
