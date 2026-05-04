/*
  Warnings:

  - You are about to drop the column `displayOrder` on the `ExerciseMedia` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `ExerciseMedia` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `ExerciseMedia` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `ExerciseMedia` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `ExerciseMedia` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `ExerciseMedia` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `ExerciseMedia` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ExerciseMedia_exerciseId_displayOrder_idx";

-- DropIndex
DROP INDEX "ExerciseMedia_exerciseId_isPrimary_idx";

-- AlterTable
ALTER TABLE "ExerciseMedia" DROP COLUMN "displayOrder",
DROP COLUMN "duration",
DROP COLUMN "fileSize",
DROP COLUMN "height",
DROP COLUMN "isPrimary",
DROP COLUMN "publicId",
DROP COLUMN "width";
