-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN     "coachUserId" TEXT,
ALTER COLUMN "planWeekId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlanWeekWorkout" (
    "id" TEXT NOT NULL,
    "planWeekId" TEXT NOT NULL,
    "workoutTemplateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "progressionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanWeekWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanWeekWorkout_planWeekId_sortOrder_idx" ON "PlanWeekWorkout"("planWeekId", "sortOrder");

-- CreateIndex
CREATE INDEX "PlanWeekWorkout_workoutTemplateId_idx" ON "PlanWeekWorkout"("workoutTemplateId");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_coachUserId_idx" ON "WorkoutTemplate"("coachUserId");

-- AddForeignKey
ALTER TABLE "PlanWeekWorkout" ADD CONSTRAINT "PlanWeekWorkout_planWeekId_fkey" FOREIGN KEY ("planWeekId") REFERENCES "PlanWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanWeekWorkout" ADD CONSTRAINT "PlanWeekWorkout_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutTemplate" ADD CONSTRAINT "WorkoutTemplate_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
