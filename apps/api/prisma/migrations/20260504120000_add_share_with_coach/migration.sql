-- AlterTable
ALTER TABLE "HealthGoal" ADD COLUMN "shareWithCoach" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "BodyMetricEntry" ADD COLUMN "shareWithCoach" BOOLEAN NOT NULL DEFAULT true;
