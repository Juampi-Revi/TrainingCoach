import type { WorkoutTemplateDetail } from "@regen/types";

export interface WE {
  id: string;
  sortOrder: number;
  supersetGroup: string | null;
  isWarmup: boolean;
  workoutBlockId: string | null;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null; thumbnailUrl?: string | null; youtubeUrl?: string | null; isSystem?: boolean };
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

export type WB = WorkoutTemplateDetail["blocks"][number] & { sortOrder?: number };

export interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
}

export interface AltItem {
  id: string;
  priority: number;
  note: string | null;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null };
}
