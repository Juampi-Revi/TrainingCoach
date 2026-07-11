ALTER TABLE "WorkoutBlock"
ADD COLUMN "isExtra" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "roleLabel" TEXT,
ADD COLUMN "effortLabel" TEXT,
ADD COLUMN "executionLabel" TEXT;

ALTER TABLE "WorkoutExercise"
ADD COLUMN "roleLabel" TEXT,
ADD COLUMN "effortLabel" TEXT,
ADD COLUMN "executionLabel" TEXT,
ADD COLUMN "groupIsExtra" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "groupRoleLabel" TEXT,
ADD COLUMN "groupEffortLabel" TEXT,
ADD COLUMN "groupExecutionLabel" TEXT;
