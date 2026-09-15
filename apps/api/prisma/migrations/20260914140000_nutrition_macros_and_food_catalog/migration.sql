-- AlterTable
ALTER TABLE "User" ADD COLUMN "sex" TEXT;
ALTER TABLE "User" ADD COLUMN "birthYear" INTEGER;
ALTER TABLE "User" ADD COLUMN "heightCm" DECIMAL(5,1);
ALTER TABLE "User" ADD COLUMN "activityLevel" TEXT;

-- CreateTable
CREATE TABLE "NutritionTarget" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "carbsG" INTEGER NOT NULL,
    "fatG" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "proteinPerKg" DECIMAL(3,1) NOT NULL,
    "activityLevel" TEXT,
    "updatedByRole" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "kcalPer100g" DECIMAL(7,1) NOT NULL,
    "proteinPer100g" DECIMAL(6,1) NOT NULL,
    "carbsPer100g" DECIMAL(6,1) NOT NULL,
    "fatPer100g" DECIMAL(6,1) NOT NULL,
    "servingLabel" TEXT,
    "servingGrams" DECIMAL(7,1),
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "barcode" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodLogItem" (
    "id" TEXT NOT NULL,
    "foodLogEntryId" TEXT NOT NULL,
    "foodItemId" TEXT,
    "name" TEXT NOT NULL,
    "grams" DECIMAL(8,1) NOT NULL,
    "servingLabel" TEXT,
    "kcal" DECIMAL(8,1) NOT NULL,
    "proteinG" DECIMAL(7,1) NOT NULL,
    "carbsG" DECIMAL(7,1) NOT NULL,
    "fatG" DECIMAL(7,1) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTarget_clientUserId_key" ON "NutritionTarget"("clientUserId");
CREATE INDEX "NutritionTarget_clientUserId_idx" ON "NutritionTarget"("clientUserId");
CREATE UNIQUE INDEX "FoodItem_source_sourceId_key" ON "FoodItem"("source", "sourceId");
CREATE INDEX "FoodItem_nameNormalized_idx" ON "FoodItem"("nameNormalized");
CREATE INDEX "FoodItem_barcode_idx" ON "FoodItem"("barcode");
CREATE INDEX "FoodItem_isSystem_idx" ON "FoodItem"("isSystem");
CREATE INDEX "FoodLogItem_foodLogEntryId_sortOrder_idx" ON "FoodLogItem"("foodLogEntryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "NutritionTarget" ADD CONSTRAINT "NutritionTarget_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FoodLogItem" ADD CONSTRAINT "FoodLogItem_foodLogEntryId_fkey" FOREIGN KEY ("foodLogEntryId") REFERENCES "FoodLogEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodLogItem" ADD CONSTRAINT "FoodLogItem_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
