-- Idempotent migration: drop existing tables and recreate with correct schema
-- Safe for both fresh installs and existing databases

-- Drop in correct order (child tables first due to FK constraints)
DROP TABLE IF EXISTS "HealthSyncedActivity" CASCADE;
DROP TABLE IF EXISTS "HealthProviderConnection" CASCADE;

-- Create HealthProviderConnection
CREATE TABLE "HealthProviderConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProviderConnection_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "HealthProviderConnection_userId_provider_key" ON "HealthProviderConnection"("userId", "provider");
CREATE INDEX "HealthProviderConnection_userId_isActive_idx" ON "HealthProviderConnection"("userId", "isActive");

-- Add foreign key
ALTER TABLE "HealthProviderConnection" ADD CONSTRAINT "HealthProviderConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create HealthSyncedActivity
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

-- Create indexes
CREATE UNIQUE INDEX "HealthSyncedActivity_userId_provider_providerRef_key" ON "HealthSyncedActivity"("userId", "provider", "providerRef");
CREATE INDEX "HealthSyncedActivity_userId_date_idx" ON "HealthSyncedActivity"("userId", "date" DESC);
CREATE INDEX "HealthSyncedActivity_connectionId_idx" ON "HealthSyncedActivity"("connectionId");

-- Add foreign key
ALTER TABLE "HealthSyncedActivity" ADD CONSTRAINT "HealthSyncedActivity_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HealthProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
