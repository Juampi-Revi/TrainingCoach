-- EMERGENCY RECOVERY SCRIPT FOR PRODUCTION
-- Run this directly in your PostgreSQL database if exercises page is broken
-- This script is idempotent (safe to run multiple times)

-- Check current state
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'ExerciseMedia';

-- Add missing columns (will skip if they already exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='publicId') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "publicId" TEXT;
        RAISE NOTICE 'Added column publicId';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='width') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "width" INTEGER;
        RAISE NOTICE 'Added column width';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='height') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "height" INTEGER;
        RAISE NOTICE 'Added column height';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='fileSize') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "fileSize" INTEGER;
        RAISE NOTICE 'Added column fileSize';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='duration') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "duration" DOUBLE PRECISION;
        RAISE NOTICE 'Added column duration';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='isPrimary') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "isPrimary" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column isPrimary';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ExerciseMedia' AND column_name='displayOrder') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "displayOrder" INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column displayOrder';
    END IF;
END $$;

-- Recreate indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ExerciseMedia_exerciseId_displayOrder_idx') THEN
        CREATE INDEX "ExerciseMedia_exerciseId_displayOrder_idx" ON "ExerciseMedia"("exerciseId", "displayOrder");
        RAISE NOTICE 'Created index ExerciseMedia_exerciseId_displayOrder_idx';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ExerciseMedia_exerciseId_isPrimary_idx') THEN
        CREATE INDEX "ExerciseMedia_exerciseId_isPrimary_idx" ON "ExerciseMedia"("exerciseId", "isPrimary");
        RAISE NOTICE 'Created index ExerciseMedia_exerciseId_isPrimary_idx';
    END IF;
END $$;

-- Verify recovery
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'ExerciseMedia'
ORDER BY ordinal_position;
