-- Prevent same provider account from connecting to multiple users
CREATE UNIQUE INDEX "HealthProviderConnection_providerUnique" ON "HealthProviderConnection"("providerUserId", "provider") WHERE "providerUserId" IS NOT NULL;
