-- Fix HealthSyncedActivity: drop and recreate with correct schema
-- This is faster and safer than multiple ALTER statements

DROP TABLE IF EXISTS "HealthSyncedActivity" CASCADE;

CREATE TABLE "HealthSyncedActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "steps" INTEGER,
    "distanceMeters" INTEGER,
    "calories" DOUBLE PRECISION,
    "activeMinutes" INTEGER,
    "sleepMinutes" INTEGER,
    "deepSleepMinutes" INTEGER,
    "lightSleepMinutes" INTEGER,
    "remSleepMinutes" INTEGER,
    "restingHeartRate" INTEGER,
    "avgHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "stress" INTEGER,
    "bodyBattery" INTEGER,
    "spo2" DOUBLE PRECISION,
    "activityType" TEXT,
    "activityMinutes" INTEGER,
    "rawData" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthSyncedActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HealthSyncedActivity_userId_providerRef_key" ON "HealthSyncedActivity"("userId", "providerRef");
CREATE INDEX "HealthSyncedActivity_connectionId_idx" ON "HealthSyncedActivity"("connectionId");
ALTER TABLE "HealthSyncedActivity" ADD CONSTRAINT "HealthSyncedActivity_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HealthProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
