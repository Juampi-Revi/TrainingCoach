import type { SessionStatus } from "@regen/types";

type ExerciseProgressLike = {
  workoutExercise?: {
    targetSets: number | null;
    workoutBlock?: { type: string } | null;
  } | null;
  sets?: unknown[];
  _count?: { sets?: number | null };
};

export interface SessionProgressSummary {
  setsCount: number;
  targetSetsCount: number;
}

export function summarizeSessionProgress(exercises: ExerciseProgressLike[]): SessionProgressSummary {
  const workExercises = exercises.filter((exercise) => exercise.workoutExercise?.workoutBlock?.type !== "warmup");

  return {
    setsCount: workExercises.reduce((acc, exercise) => {
      if (typeof exercise._count?.sets === "number") return acc + exercise._count.sets;
      return acc + (exercise.sets?.length ?? 0);
    }, 0),
    targetSetsCount: workExercises.reduce((acc, exercise) => acc + (exercise.workoutExercise?.targetSets ?? 0), 0),
  };
}

export function resolveSessionStatus(status: string, summary: SessionProgressSummary): SessionStatus {
  if (status === "partial") {
    return summary.targetSetsCount > 0 && summary.setsCount >= summary.targetSetsCount
      ? "completed"
      : "partial";
  }

  if (status === "completed" && summary.targetSetsCount > 0 && summary.setsCount < summary.targetSetsCount) {
    return "partial";
  }

  if (
    status === "in_progress" ||
    status === "completed" ||
    status === "discarded" ||
    status === "pending"
  ) {
    return status;
  }

  return "in_progress";
}
