-- Migration: Universal Blocks
-- Changes:
-- 1. WorkoutBlock: add new fields for all block types
-- 2. WorkoutBlock: type changes from 'tabata'|'hiit'|'emom'|'amrap' to 'warmup'|'strength'|'intervals'|'cardio'|'cooldown'
-- 3. WorkoutBlock: add intervalType for interval blocks
-- 4. WorkoutExercise: remove isWarmup, make workoutBlockId required
-- 5. Data migration: create default blocks for existing exercises

-- Step 1: Add new columns to WorkoutBlock
ALTER TABLE "WorkoutBlock" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "WorkoutBlock" ADD COLUMN IF NOT EXISTS "restAfterSeconds" INTEGER;
ALTER TABLE "WorkoutBlock" ADD COLUMN IF NOT EXISTS "intervalType" TEXT;
ALTER TABLE "WorkoutBlock" ADD COLUMN IF NOT EXISTS "restBetweenExercisesSeconds" INTEGER;
ALTER TABLE "WorkoutBlock" ADD COLUMN IF NOT EXISTS "targetMinutes" INTEGER;
ALTER TABLE "WorkoutBlock" ADD COLUMN IF NOT EXISTS "targetZone" TEXT;

-- Step 2: Update existing interval blocks
-- Convert type='tabata'|'hiit'|'emom'|'amrap' to type='intervals' and set intervalType
UPDATE "WorkoutBlock"
SET "intervalType" = "type",
    "type" = 'intervals'
WHERE "type" IN ('tabata', 'hiit', 'emom', 'amrap');

-- Step 3: Create default strength blocks for exercises without a block
-- First, create strength blocks for each workout template that has exercises without blocks
INSERT INTO "WorkoutBlock" (
    "id", "workoutTemplateId", "sortOrder", "type", "label", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    wt.id,
    0, -- First block
    'strength',
    'Bloque de fuerza',
    NOW(),
    NOW()
FROM "WorkoutTemplate" wt
WHERE EXISTS (
    SELECT 1 FROM "WorkoutExercise" we 
    WHERE we."workoutTemplateId" = wt.id 
    AND (we."workoutBlockId" IS NULL OR we."workoutBlockId" = '')
);

-- Step 4: Create warmup blocks for warmup exercises
INSERT INTO "WorkoutBlock" (
    "id", "workoutTemplateId", "sortOrder", "type", "label", "createdAt", "updatedAt"
)
SELECT DISTINCT
    gen_random_uuid(),
    we."workoutTemplateId",
    -1, -- Before strength blocks
    'warmup',
    'Calentamiento',
    NOW(),
    NOW()
FROM "WorkoutExercise" we
WHERE we."isWarmup" = true;

-- Step 5: Update exercises to point to their new blocks
-- First, link warmup exercises to warmup blocks
UPDATE "WorkoutExercise" we
SET "workoutBlockId" = wb.id
FROM "WorkoutBlock" wb
WHERE we."isWarmup" = true
AND wb."workoutTemplateId" = we."workoutTemplateId"
AND wb."type" = 'warmup';

-- Step 6: Link remaining exercises (without block) to strength blocks
UPDATE "WorkoutExercise" we
SET "workoutBlockId" = wb.id
FROM "WorkoutBlock" wb
WHERE (we."workoutBlockId" IS NULL OR we."workoutBlockId" = '')
AND wb."workoutTemplateId" = we."workoutTemplateId"
AND wb."type" = 'strength';

-- Step 7: Re-sort blocks within each workout template
-- First, assign proper sortOrder based on type
UPDATE "WorkoutBlock"
SET "sortOrder" = CASE 
    WHEN "type" = 'warmup' THEN 0
    WHEN "type" = 'strength' THEN 1
    WHEN "type" = 'intervals' THEN 2
    WHEN "type" = 'cardio' THEN 3
    WHEN "type" = 'cooldown' THEN 4
    ELSE "sortOrder"
END
WHERE "sortOrder" = 0 OR "sortOrder" = -1;

-- Step 8: Re-sort exercises within each block
UPDATE "WorkoutExercise" we
SET "sortOrder" = sub.row_num
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY "workoutBlockId" ORDER BY "sortOrder", "createdAt") as row_num
    FROM "WorkoutExercise"
) sub
WHERE we.id = sub.id;

-- Step 9: Remove isWarmup column from WorkoutExercise
ALTER TABLE "WorkoutExercise" DROP COLUMN IF EXISTS "isWarmup";

-- Step 10: Make workoutBlockId NOT NULL
-- First, verify no nulls remain
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "WorkoutExercise" WHERE "workoutBlockId" IS NULL) THEN
        RAISE EXCEPTION 'There are still exercises without a block. Migration cannot continue.';
    END IF;
END $$;

ALTER TABLE "WorkoutExercise" ALTER COLUMN "workoutBlockId" SET NOT NULL;

-- Step 11: Remove warmup columns from WorkoutTemplate
ALTER TABLE "WorkoutTemplate" DROP COLUMN IF EXISTS "warmupNotes";
ALTER TABLE "WorkoutTemplate" DROP COLUMN IF EXISTS "warmupMinutes";

-- Step 12: Add index on workoutBlockId for WorkoutExercise
CREATE INDEX IF NOT EXISTS "WorkoutExercise_workoutBlockId_idx" ON "WorkoutExercise"("workoutBlockId");
