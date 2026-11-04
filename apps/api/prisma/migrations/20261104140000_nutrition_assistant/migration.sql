-- Food log extras for assistant snapshots
ALTER TABLE "FoodLogEntry" ADD COLUMN "localDate" DATE;
ALTER TABLE "FoodLogEntry" ADD COLUMN "deletedAt" TIMESTAMP(3);
UPDATE "FoodLogEntry"
SET "localDate" = (("loggedAt" AT TIME ZONE 'America/Argentina/Buenos_Aires')::date)
WHERE "localDate" IS NULL;
CREATE INDEX "FoodLogEntry_clientUserId_localDate_idx" ON "FoodLogEntry"("clientUserId", "localDate");

ALTER TABLE "FoodLogItem" ADD COLUMN "quantity" DECIMAL(8,2);
ALTER TABLE "FoodLogItem" ADD COLUMN "unit" TEXT;
ALTER TABLE "FoodLogItem" ADD COLUMN "provenance" TEXT;
ALTER TABLE "FoodLogItem" ADD COLUMN "kcalPer100g" DECIMAL(7,1);
ALTER TABLE "FoodLogItem" ADD COLUMN "proteinPer100g" DECIMAL(6,1);
ALTER TABLE "FoodLogItem" ADD COLUMN "carbsPer100g" DECIMAL(6,1);
ALTER TABLE "FoodLogItem" ADD COLUMN "fatPer100g" DECIMAL(6,1);

CREATE TABLE "NutritionDrink" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "consumedAt" TIMESTAMPTZ NOT NULL,
    "foodItemId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "milliliters" DECIMAL(8,2) NOT NULL,
    "grams" DECIMAL(8,2) NOT NULL,
    "provenance" TEXT NOT NULL,
    "kcal" DECIMAL(8,1) NOT NULL,
    "proteinG" DECIMAL(7,1) NOT NULL,
    "carbsG" DECIMAL(7,1) NOT NULL,
    "fatG" DECIMAL(7,1) NOT NULL,
    "kcalPer100g" DECIMAL(7,1) NOT NULL,
    "proteinPer100g" DECIMAL(6,1) NOT NULL,
    "carbsPer100g" DECIMAL(6,1) NOT NULL,
    "fatPer100g" DECIMAL(6,1) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionDrink_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NutritionDrink_clientUserId_localDate_idx" ON "NutritionDrink"("clientUserId", "localDate");
ALTER TABLE "NutritionDrink" ADD CONSTRAINT "NutritionDrink_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NutritionSupplement" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionSupplement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NutritionSupplement_clientUserId_active_idx" ON "NutritionSupplement"("clientUserId", "active");
ALTER TABLE "NutritionSupplement" ADD CONSTRAINT "NutritionSupplement_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NutritionSupplementLog" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "supplementId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "NutritionSupplementLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NutritionSupplementLog_supplementId_localDate_key" ON "NutritionSupplementLog"("supplementId", "localDate");
CREATE INDEX "NutritionSupplementLog_clientUserId_localDate_idx" ON "NutritionSupplementLog"("clientUserId", "localDate");
ALTER TABLE "NutritionSupplementLog" ADD CONSTRAINT "NutritionSupplementLog_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NutritionSupplementLog" ADD CONSTRAINT "NutritionSupplementLog_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "NutritionSupplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NutritionNote" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NutritionNote_clientUserId_doneAt_createdAt_idx" ON "NutritionNote"("clientUserId", "doneAt", "createdAt");
ALTER TABLE "NutritionNote" ADD CONSTRAINT "NutritionNote_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NutritionPendingAction" (
    "id" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionPendingAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NutritionPendingAction_clientUserId_kind_consumedAt_idx" ON "NutritionPendingAction"("clientUserId", "kind", "consumedAt");
ALTER TABLE "NutritionPendingAction" ADD CONSTRAINT "NutritionPendingAction_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssistantConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssistantConversation_userId_createdAt_idx" ON "AssistantConversation"("userId", "createdAt");
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "inputKind" TEXT NOT NULL DEFAULT 'text',
    "imageJpeg" BYTEA,
    "clientMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssistantMessage_userId_clientMessageId_key" ON "AssistantMessage"("userId", "clientMessageId");
CREATE INDEX "AssistantMessage_conversationId_createdAt_idx" ON "AssistantMessage"("conversationId", "createdAt");
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssistantToolExecution" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "result" JSONB,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantToolExecution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssistantToolExecution_userId_createdAt_idx" ON "AssistantToolExecution"("userId", "createdAt");
ALTER TABLE "AssistantToolExecution" ADD CONSTRAINT "AssistantToolExecution_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AssistantMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssistantToolExecution" ADD CONSTRAINT "AssistantToolExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AssistantUsageCharge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "cachedInputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costMicroUsd" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssistantUsageCharge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssistantUsageCharge_monthKey_idx" ON "AssistantUsageCharge"("monthKey");
ALTER TABLE "AssistantUsageCharge" ADD CONSTRAINT "AssistantUsageCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
