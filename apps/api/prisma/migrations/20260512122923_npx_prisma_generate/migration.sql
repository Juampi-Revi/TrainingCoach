/*
  Warnings:

  - Made the column `isPrimary` on table `ExerciseMedia` required. This step will fail if there are existing NULL values in that column.
  - Made the column `displayOrder` on table `ExerciseMedia` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "WorkoutExercise" DROP CONSTRAINT "WorkoutExercise_workoutBlockId_fkey";

-- DropIndex
DROP INDEX "CoachExerciseFavorite_coachUserId_createdAt_idx";

-- AlterTable
UPDATE "ExerciseMedia" SET "isPrimary" = false WHERE "isPrimary" IS NULL;
UPDATE "ExerciseMedia" SET "displayOrder" = 0 WHERE "displayOrder" IS NULL;

ALTER TABLE "ExerciseMedia" ALTER COLUMN "isPrimary" SET NOT NULL,
ALTER COLUMN "displayOrder" SET NOT NULL;

-- CreateTable
CREATE TABLE "HealthDataSync" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthDataSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthDataSync_userId_idx" ON "HealthDataSync"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthDataSync_userId_provider_key" ON "HealthDataSync"("userId", "provider");

-- CreateIndex
CREATE INDEX "CoachExerciseFavorite_coachUserId_createdAt_idx" ON "CoachExerciseFavorite"("coachUserId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutBlockId_fkey" FOREIGN KEY ("workoutBlockId") REFERENCES "WorkoutBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthDataSync" ADD CONSTRAINT "HealthDataSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
