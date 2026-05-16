-- CreateTable
CREATE TABLE "CoachInvite" (
    "id" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachInvite_token_key" ON "CoachInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CoachInvite_coachUserId_email_key" ON "CoachInvite"("coachUserId", "email");

-- CreateIndex
CREATE INDEX "CoachInvite_token_idx" ON "CoachInvite"("token");

-- AddForeignKey
ALTER TABLE "CoachInvite" ADD CONSTRAINT "CoachInvite_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
