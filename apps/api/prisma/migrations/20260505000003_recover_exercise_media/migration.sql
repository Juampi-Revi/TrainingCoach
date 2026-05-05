-- Migration to recover columns that were accidentally dropped
-- This migration is safe to run even if columns already exist (idempotent)

-- Add columns back if they don't exist
-- Note: PostgreSQL doesn't support "IF NOT EXISTS" for ALTER TABLE ADD COLUMN directly
-- But we can use DO $$ blocks to make it idempotent

DO $$
BEGIN
    -- Add publicId column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='publicId') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "publicId" TEXT;
    END IF;

    -- Add width column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='width') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "width" INTEGER;
    END IF;

    -- Add height column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='height') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "height" INTEGER;
    END IF;

    -- Add fileSize column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='fileSize') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "fileSize" INTEGER;
    END IF;

    -- Add duration column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='duration') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "duration" DOUBLE PRECISION;
    END IF;

    -- Add isPrimary column with default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='isPrimary') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "isPrimary" BOOLEAN DEFAULT false;
    END IF;

    -- Add displayOrder column with default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ExerciseMedia' AND column_name='displayOrder') THEN
        ALTER TABLE "ExerciseMedia" ADD COLUMN "displayOrder" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Recreate indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'ExerciseMedia_exerciseId_displayOrder_idx') THEN
        CREATE INDEX "ExerciseMedia_exerciseId_displayOrder_idx" ON "ExerciseMedia"("exerciseId", "displayOrder");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'ExerciseMedia_exerciseId_isPrimary_idx') THEN
        CREATE INDEX "ExerciseMedia_exerciseId_isPrimary_idx" ON "ExerciseMedia"("exerciseId", "isPrimary");
    END IF;
END $$;
