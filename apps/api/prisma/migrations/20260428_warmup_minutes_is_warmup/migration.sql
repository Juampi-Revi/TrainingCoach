-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN IF NOT EXISTS "isWarmup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN IF NOT EXISTS "warmupMinutes" INTEGER;
