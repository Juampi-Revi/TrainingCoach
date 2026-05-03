-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "workoutBlockId" TEXT;

-- CreateTable
CREATE TABLE "WorkoutBlock" (
    "id" TEXT NOT NULL,
    "workoutTemplateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "workSeconds" INTEGER,
    "restSeconds" INTEGER,
    "rounds" INTEGER,
    "totalDurationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutBlock_workoutTemplateId_sortOrder_idx" ON "WorkoutBlock"("workoutTemplateId", "sortOrder");

-- AddForeignKey
ALTER TABLE "WorkoutBlock" ADD CONSTRAINT "WorkoutBlock_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutBlockId_fkey" FOREIGN KEY ("workoutBlockId") REFERENCES "WorkoutBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
