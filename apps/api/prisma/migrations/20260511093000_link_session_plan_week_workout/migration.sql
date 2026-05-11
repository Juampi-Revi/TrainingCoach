-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN "planWeekWorkoutId" TEXT;

-- CreateIndex
CREATE INDEX "WorkoutSession_planWeekWorkoutId_idx" ON "WorkoutSession"("planWeekWorkoutId");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_planWeekWorkoutId_fkey"
FOREIGN KEY ("planWeekWorkoutId") REFERENCES "PlanWeekWorkout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

