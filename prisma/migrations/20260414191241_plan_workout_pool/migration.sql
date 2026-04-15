-- CreateTable
CREATE TABLE "PlanWorkout" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "workoutTemplateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanWorkout_planId_sortOrder_idx" ON "PlanWorkout"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "PlanWorkout_workoutTemplateId_idx" ON "PlanWorkout"("workoutTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanWorkout_planId_workoutTemplateId_key" ON "PlanWorkout"("planId", "workoutTemplateId");

-- AddForeignKey
ALTER TABLE "PlanWorkout" ADD CONSTRAINT "PlanWorkout_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanWorkout" ADD CONSTRAINT "PlanWorkout_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
