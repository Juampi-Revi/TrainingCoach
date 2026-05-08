-- Add source column to DailyHealthEntry for tracking sync origin
ALTER TABLE "DailyHealthEntry" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';
