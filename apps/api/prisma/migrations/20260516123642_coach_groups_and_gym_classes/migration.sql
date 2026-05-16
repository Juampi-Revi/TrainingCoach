-- CreateTable
CREATE TABLE "CoachGroup" (
    "id" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymClass" (
    "id" TEXT NOT NULL,
    "gymUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workoutTemplateId" TEXT NOT NULL,
    "groupId" TEXT,
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "currentExercise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymClass_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN "gymClassId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoachGroup_coachUserId_name_key" ON "CoachGroup"("coachUserId", "name");

-- CreateIndex
CREATE INDEX "CoachGroup_coachUserId_idx" ON "CoachGroup"("coachUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachGroupMember_groupId_clientUserId_key" ON "CoachGroupMember"("groupId", "clientUserId");

-- CreateIndex
CREATE INDEX "CoachGroupMember_clientUserId_idx" ON "CoachGroupMember"("clientUserId");

-- CreateIndex
CREATE INDEX "GymClass_gymUserId_scheduledAt_idx" ON "GymClass"("gymUserId", "scheduledAt" DESC);

-- CreateIndex
CREATE INDEX "GymClass_workoutTemplateId_idx" ON "GymClass"("workoutTemplateId");

-- CreateIndex
CREATE INDEX "GymClass_groupId_idx" ON "GymClass"("groupId");

-- CreateIndex
CREATE INDEX "WorkoutSession_gymClassId_idx" ON "WorkoutSession"("gymClassId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_clientUserId_gymClassId_key" ON "WorkoutSession"("clientUserId", "gymClassId");

-- AddForeignKey
ALTER TABLE "CoachGroup" ADD CONSTRAINT "CoachGroup_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachGroupMember" ADD CONSTRAINT "CoachGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CoachGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachGroupMember" ADD CONSTRAINT "CoachGroupMember_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_gymUserId_fkey" FOREIGN KEY ("gymUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_workoutTemplateId_fkey" FOREIGN KEY ("workoutTemplateId") REFERENCES "WorkoutTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymClass" ADD CONSTRAINT "GymClass_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CoachGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_gymClassId_fkey" FOREIGN KEY ("gymClassId") REFERENCES "GymClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
