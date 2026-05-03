import { z } from "zod";

// PATCH /api/v1/client/sessions/:sessionId
export const sessionPatchSchema = z.object({
  status: z.enum(["in_progress", "completed", "discarded"]).optional(),
  energyRating: z.union([z.number().int().min(1).max(5), z.null()]).optional(),
  sessionNotes: z.union([z.string().max(2000), z.null()]).optional(),
  performedAt: z.coerce.date().optional(),
  completedAt: z.union([z.coerce.date(), z.null()]).optional(),
}).refine(
  (data) => {
    if (data.performedAt && data.completedAt && data.completedAt instanceof Date) {
      return data.completedAt.getTime() >= data.performedAt.getTime();
    }
    return true;
  },
  { message: "completedAt must be after performedAt", path: ["completedAt"] },
);

// PATCH /api/v1/coach/workouts/:workoutTemplateId/exercises/:weId
export const workoutExercisePatchSchema = z.object({
  workoutBlockId: z.union([z.string(), z.null()]).optional(),
  targetSets: z.union([z.number().int().positive(), z.null()]).optional(),
  targetReps: z.union([z.string().max(50), z.null()]).optional(),
  durationSeconds: z.union([z.number().int().positive(), z.null()]).optional(),
  intensityType: z.union([z.string().max(50), z.null()]).optional(),
  intensityTarget: z.union([z.number().positive(), z.null()]).optional(),
  restSeconds: z.union([z.number().int().min(0), z.null()]).optional(),
  notes: z.union([z.string().max(2000), z.null()]).optional(),
  sortOrder: z.number().int().optional(),
  supersetGroup: z.union([z.string().max(50), z.null()]).optional(),
  isWarmup: z.boolean().optional(),
  groupNote: z.union([z.string().max(2000), z.null()]).optional(),
});
