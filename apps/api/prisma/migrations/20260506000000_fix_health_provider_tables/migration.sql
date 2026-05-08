/*
  Warnings:
  - Migration 20260505000002 created HealthDataSync but the schema now uses HealthProviderConnection
  - This migration creates the missing tables and migrates existing data
*/

-- CreateTable: HealthProviderConnection (with old table structure)
CREATE TABLE IF NOT EXISTS "HealthProviderConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastError" TEXT,
    "scope" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProviderConnection_pkey" PRIMARY KEY ("id")
);

-- Migrate data from HealthDataSync if it exists
INSERT INTO "HealthProviderConnection" ("id", "userId", "provider", "providerUserId", "accessToken", "refreshToken", "tokenExpiresAt", "lastSyncAt", "scope", "isActive", "createdAt", "updatedAt")
SELECT 
    "id",
    "userId",
    "provider",
    "providerUserId",
    "accessToken",
    "refreshToken",
    "tokenExpiresAt",
    "lastSyncAt",
    '[]',
    "isActive",
    "createdAt",
    "updatedAt"
FROM "HealthDataSync"
WHERE "id" NOT IN (SELECT "id" FROM "HealthProviderConnection");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HealthProviderConnection_userId_provider_key" ON "HealthProviderConnection"("userId", "provider");
CREATE INDEX IF NOT EXISTS "HealthProviderConnection_userId_idx" ON "HealthProviderConnection"("userId");

-- AddForeignKey
ALTER TABLE "HealthProviderConnection" ADD CONSTRAINT "HealthProviderConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: HealthSyncedActivity
CREATE TABLE IF NOT EXISTS "HealthSyncedActivity" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerActivityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "distanceMeters" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSyncedActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "HealthSyncedActivity_connectionId_providerActivityId_key" ON "HealthSyncedActivity"("connectionId", "providerActivityId");
CREATE INDEX IF NOT EXISTS "HealthSyncedActivity_connectionId_idx" ON "HealthSyncedActivity"("connectionId");

-- AddForeignKey
ALTER TABLE "HealthSyncedActivity" ADD CONSTRAINT "HealthSyncedActivity_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "HealthProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
