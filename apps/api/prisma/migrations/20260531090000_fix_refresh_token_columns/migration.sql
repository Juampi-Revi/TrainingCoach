-- Fix drift: ensure refresh token columns exist in production
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "refreshTokenExpiry" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_refreshToken_key" ON "User"("refreshToken");
