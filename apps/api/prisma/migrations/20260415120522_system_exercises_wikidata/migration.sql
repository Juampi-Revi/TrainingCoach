/*
  Warnings:

  - A unique constraint covering the columns `[source,sourceId]` on the table `Exercise` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceId" TEXT,
ALTER COLUMN "coachUserId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Exercise_isSystem_idx" ON "Exercise"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_source_sourceId_key" ON "Exercise"("source", "sourceId");
