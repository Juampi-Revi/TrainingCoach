-- AlterTable
ALTER TABLE "ExerciseMedia" ADD COLUMN "publicId" TEXT;
ALTER TABLE "ExerciseMedia" ADD COLUMN "width" INTEGER;
ALTER TABLE "ExerciseMedia" ADD COLUMN "height" INTEGER;
ALTER TABLE "ExerciseMedia" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "ExerciseMedia" ADD COLUMN "duration" DOUBLE PRECISION;
ALTER TABLE "ExerciseMedia" ADD COLUMN "isPrimary" BOOLEAN DEFAULT false;
ALTER TABLE "ExerciseMedia" ADD COLUMN "displayOrder" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "ExerciseMedia_exerciseId_displayOrder_idx" ON "ExerciseMedia"("exerciseId", "displayOrder");
CREATE INDEX "ExerciseMedia_exerciseId_isPrimary_idx" ON "ExerciseMedia"("exerciseId", "isPrimary");
