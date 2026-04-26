-- Track when session was completed (for duration calculation)
ALTER TABLE "WorkoutSession" ADD COLUMN "completedAt" TIMESTAMPTZ;

-- YouTube URL on exercises
ALTER TABLE "Exercise" ADD COLUMN "youtubeUrl" TEXT;

-- Coach note per superset group (stored on first exercise of the group)
ALTER TABLE "WorkoutExercise" ADD COLUMN "groupNote" TEXT;
