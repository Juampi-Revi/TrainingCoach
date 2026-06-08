-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN     "sport" TEXT;

-- CreateTable
CREATE TABLE "WorkoutBlockStep" (
    "id" TEXT NOT NULL,
    "workoutBlockId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "instruction" TEXT,
    "durationSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "targetType" TEXT,
    "targetLabel" TEXT,
    "targetValueLow" DECIMAL(65,30),
    "targetValueHigh" DECIMAL(65,30),
    "targetUnit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutBlockStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSessionActivity" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalActivityId" TEXT NOT NULL,
    "sport" TEXT,
    "title" TEXT,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "elapsedTimeSeconds" INTEGER,
    "movingTimeSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "calories" DOUBLE PRECISION,
    "averageHeartrate" INTEGER,
    "maxHeartrate" INTEGER,
    "averageSpeed" DOUBLE PRECISION,
    "maxSpeed" DOUBLE PRECISION,
    "averageCadence" DOUBLE PRECISION,
    "elevationGainMeters" DOUBLE PRECISION,
    "mapPolyline" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSessionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutBlockStep_workoutBlockId_sortOrder_idx" ON "WorkoutBlockStep"("workoutBlockId", "sortOrder");

-- CreateIndex
CREATE INDEX "WorkoutSessionActivity_workoutSessionId_startedAt_idx" ON "WorkoutSessionActivity"("workoutSessionId", "startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSessionActivity_provider_externalActivityId_key" ON "WorkoutSessionActivity"("provider", "externalActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSessionActivity_workoutSessionId_provider_key" ON "WorkoutSessionActivity"("workoutSessionId", "provider");

-- AddForeignKey
ALTER TABLE "WorkoutBlockStep" ADD CONSTRAINT "WorkoutBlockStep_workoutBlockId_fkey" FOREIGN KEY ("workoutBlockId") REFERENCES "WorkoutBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionActivity" ADD CONSTRAINT "WorkoutSessionActivity_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
