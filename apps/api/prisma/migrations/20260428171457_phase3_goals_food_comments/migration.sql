-- AlterTable
ALTER TABLE "FoodLogEntry" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "sourceRef" TEXT;

-- CreateTable
CREATE TABLE "FoodCoachComment" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodCoachComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthGoal" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetNumber" DECIMAL(65,30),
    "targetInt" INTEGER,
    "unit" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodCoachComment_foodId_createdAt_idx" ON "FoodCoachComment"("foodId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FoodCoachComment_coachUserId_createdAt_idx" ON "FoodCoachComment"("coachUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "HealthGoal_clientUserId_startDate_idx" ON "HealthGoal"("clientUserId", "startDate" DESC);

-- CreateIndex
CREATE INDEX "HealthGoal_clientUserId_kind_idx" ON "HealthGoal"("clientUserId", "kind");

-- AddForeignKey
ALTER TABLE "FoodCoachComment" ADD CONSTRAINT "FoodCoachComment_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "FoodLogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCoachComment" ADD CONSTRAINT "FoodCoachComment_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthGoal" ADD CONSTRAINT "HealthGoal_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
