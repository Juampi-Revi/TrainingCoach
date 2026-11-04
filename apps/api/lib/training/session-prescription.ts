import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapWorkoutBlockStep } from "@/lib/training/endurance";

type DecimalLike = { toString(): string } | string | number | null;

export interface StoredBlock {
  id: string;
  type: string;
  label: string | null;
  isExtra: boolean;
  labels: { role: string | null; effort: string | null; execution: string | null };
  description: string | null;
  sortOrder: number;
  restAfterSeconds: number | null;
  intervalType: string | null;
  prepareSeconds: number | null;
  workSeconds: number | null;
  restSeconds: number | null;
  rounds: number | null;
  setCount: number | null;
  restBetweenSetsSeconds: number | null;
  intervalExerciseStrategy: string | null;
  totalDurationSeconds: number | null;
  restBetweenExercisesSeconds: number | null;
  targetMinutes: number | null;
  targetZone: string | null;
  exerciseCount: number;
  steps: ReturnType<typeof mapWorkoutBlockStep>[];
}

export interface StoredTarget {
  sets: number | null;
  reps: string | null;
  durationSeconds: number | null;
  labels: { role: string | null; effort: string | null; execution: string | null };
  intensityType: string | null;
  intensityTarget: string | null;
  restSeconds: number | null;
  notes: string | null;
  groupNote: string | null;
  groupIsExtra: boolean;
  groupLabels: { role: string | null; effort: string | null; execution: string | null };
}

export interface StoredAlternative {
  exerciseId: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
}

export interface StoredPrescription {
  supersetGroup: string | null;
  block: StoredBlock | null;
  target: StoredTarget | null;
  alternatives: StoredAlternative[];
}

type BlockSource = {
  id: string;
  type: string;
  label: string | null;
  isExtra: boolean;
  roleLabel: string | null;
  effortLabel: string | null;
  executionLabel: string | null;
  description: string | null;
  sortOrder: number;
  restAfterSeconds: number | null;
  intervalType: string | null;
  prepareSeconds: number | null;
  workSeconds: number | null;
  restSeconds: number | null;
  rounds: number | null;
  setCount: number | null;
  restBetweenSetsSeconds: number | null;
  intervalExerciseStrategy: string | null;
  totalDurationSeconds: number | null;
  restBetweenExercisesSeconds: number | null;
  targetMinutes: number | null;
  targetZone: string | null;
  steps: Parameters<typeof mapWorkoutBlockStep>[0][];
  _count?: { exercises: number };
};

export type PrescriptionSource = {
  supersetGroup: string | null;
  roleLabel: string | null;
  effortLabel: string | null;
  executionLabel: string | null;
  targetSets: number | null;
  targetReps: string | null;
  durationSeconds: number | null;
  intensityType: string | null;
  intensityTarget: DecimalLike;
  restSeconds: number | null;
  notes: string | null;
  groupNote: string | null;
  groupIsExtra: boolean;
  groupRoleLabel: string | null;
  groupEffortLabel: string | null;
  groupExecutionLabel: string | null;
  workoutBlock: BlockSource | null;
  alternatives?: Array<{
    alternativeExercise: {
      id: string;
      name: string;
      primaryMuscle: string | null;
      equipment: string | null;
    };
  }>;
};

function asText(value: DecimalLike): string | null {
  if (value == null) return null;
  const text = String(value);
  return text.length ? text : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function readPrescription(value: unknown): StoredPrescription | null {
  if (!isRecord(value)) return null;
  if (!("target" in value) && !("block" in value) && !("supersetGroup" in value)) return null;
  return value as unknown as StoredPrescription;
}

export function mapStoredBlock(block: BlockSource): StoredBlock {
  return {
    id: block.id,
    type: block.type,
    label: block.label,
    isExtra: block.isExtra,
    labels: {
      role: block.roleLabel,
      effort: block.effortLabel,
      execution: block.executionLabel,
    },
    description: block.description,
    sortOrder: block.sortOrder,
    restAfterSeconds: block.restAfterSeconds,
    intervalType: block.intervalType,
    prepareSeconds: block.prepareSeconds,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    rounds: block.rounds,
    setCount: block.setCount,
    restBetweenSetsSeconds: block.restBetweenSetsSeconds,
    intervalExerciseStrategy: block.intervalExerciseStrategy,
    totalDurationSeconds: block.totalDurationSeconds,
    restBetweenExercisesSeconds: block.restBetweenExercisesSeconds,
    targetMinutes: block.targetMinutes,
    targetZone: block.targetZone,
    exerciseCount: block._count?.exercises ?? 0,
    steps: block.steps.map(mapWorkoutBlockStep),
  };
}

export function buildPrescription(source: PrescriptionSource): StoredPrescription {
  return {
    supersetGroup: source.supersetGroup,
    block: source.workoutBlock ? mapStoredBlock(source.workoutBlock) : null,
    target: {
      sets: source.targetSets,
      reps: source.targetReps,
      durationSeconds: source.durationSeconds,
      labels: {
        role: source.roleLabel,
        effort: source.effortLabel,
        execution: source.executionLabel,
      },
      intensityType: source.intensityType,
      intensityTarget: asText(source.intensityTarget),
      restSeconds: source.restSeconds,
      notes: source.notes,
      groupNote: source.groupNote,
      groupIsExtra: source.groupIsExtra,
      groupLabels: {
        role: source.groupRoleLabel,
        effort: source.groupEffortLabel,
        execution: source.groupExecutionLabel,
      },
    },
    alternatives: (source.alternatives ?? []).map((alt) => ({
      exerciseId: alt.alternativeExercise.id,
      name: alt.alternativeExercise.name,
      primaryMuscle: alt.alternativeExercise.primaryMuscle,
      equipment: alt.alternativeExercise.equipment,
    })),
  };
}

export function resolveExercisePlan(ex: {
  prescription: unknown;
  workoutExercise: PrescriptionSource | null;
}): StoredPrescription {
  const stored = readPrescription(ex.prescription);
  if (stored) return stored;
  if (ex.workoutExercise) return buildPrescription(ex.workoutExercise);
  return { supersetGroup: null, block: null, target: null, alternatives: [] };
}

export function uniqueStoredBlocks(plans: StoredPrescription[]): StoredBlock[] {
  const byId = new Map<string, StoredBlock>();
  for (const plan of plans) {
    if (plan.block && !byId.has(plan.block.id)) byId.set(plan.block.id, plan.block);
  }
  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

type ProgressExercise = {
  prescription: unknown;
  sets?: unknown[];
  _count?: { sets?: number | null };
  workoutExercise?: {
    targetSets: number | null;
    workoutBlock?: { type: string } | null;
  } | null;
};

/** Prefer the frozen prescription when counting sets against the plan. */
export function progressExercise<T extends ProgressExercise>(ex: T): T {
  const snap = readPrescription(ex.prescription);
  if (!snap) return ex;
  return {
    ...ex,
    workoutExercise: {
      targetSets: snap.target?.sets ?? null,
      workoutBlock: snap.block ? { type: snap.block.type } : null,
    },
  } as T;
}

const prescriptionInclude = {
  workoutBlock: {
    include: {
      steps: { orderBy: { sortOrder: "asc" as const } },
      _count: { select: { exercises: true } },
    },
  },
  alternatives: {
    orderBy: { priority: "asc" as const },
    include: {
      alternativeExercise: {
        select: { id: true, name: true, primaryMuscle: true, equipment: true },
      },
    },
  },
} satisfies Prisma.WorkoutExerciseInclude;

/** Copy the current plan onto sessions before a coach edit can delete or rewrite it. */
export async function preserveAssignedSessions(workoutTemplateIds: string[]): Promise<void> {
  const ids = [...new Set(workoutTemplateIds.filter((id) => id.length > 0))];
  if (ids.length === 0) return;

  const rows = await prisma.workoutSessionExercise.findMany({
    where: {
      prescription: { equals: Prisma.DbNull },
      workoutExercise: { workoutTemplateId: { in: ids } },
    },
    select: {
      id: true,
      prescription: true,
      workoutExercise: { include: prescriptionInclude },
    },
  });

  await freezeMissingPrescriptions(rows);
}

export async function freezeMissingPrescriptions(
  exercises: Array<{ id: string; prescription: unknown; workoutExercise: PrescriptionSource | null }>,
): Promise<void> {
  const pending = exercises.filter((ex) => readPrescription(ex.prescription) == null && ex.workoutExercise);
  await Promise.all(pending.map(async (ex) => {
    const prescription = buildPrescription(ex.workoutExercise as PrescriptionSource);
    ex.prescription = prescription;
    await prisma.workoutSessionExercise.update({
      where: { id: ex.id },
      data: { prescription: prescription as unknown as Prisma.InputJsonValue },
    });
  }));
}
