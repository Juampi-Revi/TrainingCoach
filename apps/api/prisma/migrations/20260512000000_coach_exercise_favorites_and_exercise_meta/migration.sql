-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "difficulty" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "objective" TEXT;

-- CreateTable
CREATE TABLE "CoachExerciseFavorite" (
    "id" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachExerciseFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachExerciseFavorite_coachUserId_exerciseId_key" ON "CoachExerciseFavorite"("coachUserId", "exerciseId");

-- CreateIndex
CREATE INDEX "CoachExerciseFavorite_coachUserId_createdAt_idx" ON "CoachExerciseFavorite"("coachUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachExerciseFavorite_exerciseId_idx" ON "CoachExerciseFavorite"("exerciseId");

-- AddForeignKey
ALTER TABLE "CoachExerciseFavorite" ADD CONSTRAINT "CoachExerciseFavorite_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachExerciseFavorite" ADD CONSTRAINT "CoachExerciseFavorite_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

