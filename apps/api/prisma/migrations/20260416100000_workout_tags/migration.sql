-- Add tags array to WorkoutTemplate
ALTER TABLE "WorkoutTemplate" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';
