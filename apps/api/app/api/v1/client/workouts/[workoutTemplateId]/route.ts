import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, withHandler } from "@/lib/api-response";
import { mapWorkoutBlockStep } from "@/lib/training/endurance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workoutTemplateId: string }> },
) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;

    const authorized = await prisma.planAssignment.findFirst({
      where: {
        clientUserId: auth.user.sub,
        status: "active",
        plan: {
          OR: [
            { weeks: { some: { workoutTemplates: { some: { id: workoutTemplateId } } } } },
            { weeks: { some: { workouts: { some: { workoutTemplateId } } } } },
            { workouts: { some: { workoutTemplateId } } },
          ],
        },
      },
      select: { id: true },
    });
    if (!authorized) return forbidden("Access denied");

    const template = await prisma.workoutTemplate.findUnique({
      where: { id: workoutTemplateId },
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
            exercise: {
              select: {
                id: true, name: true, primaryMuscle: true, equipment: true,
                media: { select: { url: true }, take: 1, orderBy: { createdAt: "asc" as const } },
              },
            },
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
        exercise: {
          id: we.exercise.id,
          name: we.exercise.name,
          primaryMuscle: we.exercise.primaryMuscle,
          equipment: we.exercise.equipment,
          thumbnailUrl: we.exercise.media[0]?.url ?? null,
        },
        targetSets: we.targetSets,
        targetReps: we.targetReps,
        intensityType: we.intensityType,
        intensityTarget: we.intensityTarget ? String(we.intensityTarget) : null,
        restSeconds: we.restSeconds,
        notes: we.notes,
      })),
    });
  });
}
