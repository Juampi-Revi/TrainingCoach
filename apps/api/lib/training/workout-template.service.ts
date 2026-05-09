import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

const BLOCK_TYPES = ["warmup", "strength", "intervals", "cardio", "cooldown"] as const;
const INTERVAL_TYPES = ["tabata", "hiit", "emom", "amrap"] as const;

export async function createWorkoutTemplate(coachUserId: string, data: { title: string; type?: string; description?: string; tags?: string[] }) {
  return prisma.workoutTemplate.create({
    data: {
      coachUserId,
      title: data.title,
      type: data.type ?? "strength",
      description: data.description,
      tags: data.tags ?? [],
    },
  });
}

export function getWorkoutTemplateDetail(workoutTemplateId: string, coachUserId: string) {
  return prisma.workoutTemplate.findFirst({
    where: { id: workoutTemplateId, coachUserId },
    include: {
      workoutBlocks: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function updateWorkoutTemplate(workoutTemplateId: string, data: { title?: string; type?: string; description?: string; tags?: string[] }) {
  const template = await prisma.workoutTemplate.update({
    where: { id: workoutTemplateId },
    data,
  });

  const assignments = await prisma.planAssignment.findMany({
    where: { plan: { workouts: { some: { workoutTemplateId } } }, status: "active" },
    select: { clientUserId: true },
  });

  for (const a of assignments) {
    notify({
      userId: a.clientUserId,
      type: "workout_updated",
      title: "Entrenamiento actualizado",
      body: `"${template.title}" fue modificado`,
      linkUrl: `/semana/${workoutTemplateId}`,
    });
  }

  return template;
}

export function deleteWorkoutTemplate(workoutTemplateId: string, coachUserId: string) {
  return prisma.workoutTemplate.delete({
    where: { id: workoutTemplateId, coachUserId },
  });
}

export async function createBlock(workoutTemplateId: string, data: {
  type: string;
  label?: string;
  description?: string;
  intervalType?: string;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  restAfterSeconds?: number;
  targetMinutes?: number;
  targetZone?: string;
}) {
  if (!BLOCK_TYPES.includes(data.type as typeof BLOCK_TYPES[number])) {
    return { error: "Tipo de bloque inválido" };
  }
  if (data.intervalType && !INTERVAL_TYPES.includes(data.intervalType as typeof INTERVAL_TYPES[number])) {
    return { error: "Tipo de intervalo inválido" };
  }

  const maxSort = await prisma.workoutBlock.aggregate({
    where: { workoutTemplateId },
    _max: { sortOrder: true },
  });

  return prisma.workoutBlock.create({
    data: {
      workoutTemplateId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      type: data.type,
      label: data.label,
      description: data.description,
      intervalType: data.intervalType,
      workSeconds: data.workSeconds,
      restSeconds: data.restSeconds,
      rounds: data.rounds,
      restAfterSeconds: data.restAfterSeconds,
      targetMinutes: data.targetMinutes,
      targetZone: data.targetZone,
    },
  });
}

export function updateBlock(blockId: string, data: { label?: string; description?: string; intervalType?: string; workSeconds?: number; restSeconds?: number; rounds?: number; restAfterSeconds?: number; targetMinutes?: number; targetZone?: string }) {
  return prisma.workoutBlock.update({ where: { id: blockId }, data });
}

export async function deleteBlock(blockId: string) {
  const deleted = await prisma.workoutBlock.delete({ where: { id: blockId } });

  const remaining = await prisma.workoutBlock.findMany({
    where: { workoutTemplateId: deleted.workoutTemplateId },
    orderBy: { sortOrder: "asc" },
  });

  const updates = remaining.map((b: { id: string }, i: number) =>
    prisma.workoutBlock.update({ where: { id: b.id }, data: { sortOrder: i } })
  );
  await prisma.$transaction(updates);

  return deleted;
}

export async function addExerciseToWorkout(workoutTemplateId: string, blockId: string, exerciseId: string, data?: {
  targetSets?: number;
  targetReps?: string;
  durationSeconds?: number;
  restSeconds?: number;
  supersetGroup?: string;
  intensityType?: string;
  intensityTarget?: number;
  notes?: string;
}) {
  const maxSort = await prisma.workoutExercise.aggregate({
    where: { workoutTemplateId, workoutBlockId: blockId },
    _max: { sortOrder: true },
  });

  return prisma.workoutExercise.create({
    data: {
      workoutTemplateId,
      workoutBlockId: blockId,
      exerciseId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      targetSets: data?.targetSets,
      targetReps: data?.targetReps,
      durationSeconds: data?.durationSeconds,
      restSeconds: data?.restSeconds,
      supersetGroup: data?.supersetGroup,
      intensityType: data?.intensityType,
      intensityTarget: data?.intensityTarget,
      notes: data?.notes,
    },
  });
}

export function updateWorkoutExercise(weId: string, data: { targetSets?: number; targetReps?: string; durationSeconds?: number; restSeconds?: number; supersetGroup?: string; workoutBlockId?: string; intensityType?: string; intensityTarget?: number; notes?: string }) {
  return prisma.workoutExercise.update({ where: { id: weId }, data });
}

export async function deleteWorkoutExercise(weId: string) {
  const deleted = await prisma.workoutExercise.delete({ where: { id: weId } });

  const remaining = await prisma.workoutExercise.findMany({
    where: { workoutTemplateId: deleted.workoutTemplateId, workoutBlockId: deleted.workoutBlockId },
    orderBy: { sortOrder: "asc" },
  });

  const updates = remaining.map((e: { id: string }, i: number) =>
    prisma.workoutExercise.update({ where: { id: e.id }, data: { sortOrder: i } })
  );
  await prisma.$transaction(updates);

  return deleted;
}

export async function addAlternative(weId: string, exerciseId: string, priority: number = 0, note?: string) {
  const count = await prisma.workoutExerciseAlternative.count({ where: { workoutExerciseId: weId } });
  if (count >= 5) return { error: "Máximo 5 alternativas" };
  return prisma.workoutExerciseAlternative.create({
    data: { workoutExerciseId: weId, alternativeExerciseId: exerciseId, priority, note },
  });
}

export function removeAlternative(altId: string) {
  return prisma.workoutExerciseAlternative.delete({ where: { id: altId } });
}