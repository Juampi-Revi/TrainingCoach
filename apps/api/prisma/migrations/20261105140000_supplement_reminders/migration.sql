ALTER TABLE "NutritionSupplement" ADD COLUMN "remind" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "NutritionSupplement" ADD COLUMN "lastRemindedOn" DATE;
