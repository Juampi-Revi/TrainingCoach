-- Drop previous unique constraint and recreate with isActive filter
-- This allows disconnected accounts (isActive=false) to be reused by other users

DROP INDEX IF EXISTS "HealthProviderConnection_providerUnique";

CREATE UNIQUE INDEX "HealthProviderConnection_providerUnique" 
ON "HealthProviderConnection"("providerUserId", "provider") 
WHERE "providerUserId" IS NOT NULL AND "isActive" = true;
