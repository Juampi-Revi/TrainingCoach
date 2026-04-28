-- CreateTable
CREATE TABLE "DailyHealthEntry" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "steps" INTEGER,
    "sleepMinutes" INTEGER,
    "sportType" TEXT,
    "sportMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyHealthEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCoachNote" (
    "id" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCoachNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyHealthEntry_clientUserId_day_idx" ON "DailyHealthEntry"("clientUserId", "day" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyHealthEntry_clientUserId_day_key" ON "DailyHealthEntry"("clientUserId", "day");

-- CreateIndex
CREATE INDEX "HealthCoachNote_coachUserId_createdAt_idx" ON "HealthCoachNote"("coachUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "HealthCoachNote_clientUserId_day_idx" ON "HealthCoachNote"("clientUserId", "day" DESC);

-- AddForeignKey
ALTER TABLE "DailyHealthEntry" ADD CONSTRAINT "DailyHealthEntry_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCoachNote" ADD CONSTRAINT "HealthCoachNote_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCoachNote" ADD CONSTRAINT "HealthCoachNote_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
