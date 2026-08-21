-- Drop obsolete HealthDataSync (superseded by HealthProviderConnection)
DROP TABLE IF EXISTS "HealthDataSync";

-- Remove unused chat attachment columns
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaType";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaUrl";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaPublicId";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaWidth";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaHeight";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaBytes";
ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "mediaDurationSeconds";
