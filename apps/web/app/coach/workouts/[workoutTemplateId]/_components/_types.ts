import type { WorkoutTemplateDetail, WorkoutBlockSummary } from "@regen/types";

export interface WE {
  id: string;
  sortOrder: number;
  supersetGroup: string | null;
  workoutBlockId: string;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null; thumbnailUrl: string | null; youtubeUrl?: string | null; isSystem?: boolean };
  targetSets: number | null;
  targetReps: string | null;
  durationSeconds: number | null;
  intensityType: string | null;
  intensityTarget: string | null;
  restSeconds: number | null;
  notes: string | null;
  groupNote: string | null;
  alternativesCount?: number;
}

export type WB = WorkoutBlockSummary & { sortOrder?: number; restBetweenExercisesSeconds?: number | null };

export interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  difficulty?: string | null;
  objective?: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
  youtubeUrl?: string | null;
  isFavorite?: boolean;
}

export interface AltItem {
  id: string;
  priority: number;
  note: string | null;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null };
}
