-- Snapshot of the prescription at session start. Existing rows stay null
-- and are frozen on the next read, so later template edits do not rewrite them.
ALTER TABLE "WorkoutSessionExercise" ADD COLUMN "prescription" JSONB;
