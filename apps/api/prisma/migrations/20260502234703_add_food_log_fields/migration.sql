-- AlterTable
ALTER TABLE "FoodLogEntry" ADD COLUMN     "macroTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mealType" TEXT,
ADD COLUMN     "quality" TEXT;

-- CreateIndex
CREATE INDEX "FoodLogEntry_clientUserId_loggedAt_idx" ON "FoodLogEntry"("clientUserId", "loggedAt" DESC);
