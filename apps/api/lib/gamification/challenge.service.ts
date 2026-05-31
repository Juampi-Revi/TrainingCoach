import { prisma } from "@/lib/prisma";
import { awardXpFromSource } from "@/lib/gamification/xp.service";
import { notify } from "@/lib/notify";

export interface ChallengeInput {
  type: "30_day" | "weekly_volume" | "coach_challenge" | "community";
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  startDate: Date;
  endDate?: Date;
  durationDays?: number;
  targetGroupId?: string;
  xpReward?: number;
}

export interface ChallengeProgress {
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  completed: boolean;
  completedAt?: Date;
  rank?: number;
}

/**
 * Create a new challenge (coach only)
 */
export async function createChallenge(
  coachUserId: string,
  input: ChallengeInput
): Promise<{ id: string }> {
  const challenge = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "Challenge" (id, type, title, description, "targetValue", unit, "startDate", "endDate", "durationDays", "createdByCoachId", "targetGroupId", "xpReward", "isPublic", "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${input.type}, ${input.title}, ${input.description || null}, ${input.targetValue}, ${input.unit}, ${input.startDate}, ${input.endDate || null}, ${input.durationDays || null}, ${coachUserId}, ${input.targetGroupId || null}, ${input.xpReward || 200}, true, true, NOW(), NOW())
    RETURNING id
  `;

  // If targeting a specific group, auto-enroll all members
  if (input.targetGroupId) {
    const members = await prisma.coachGroupMember.findMany({
      where: { groupId: input.targetGroupId },
      select: { clientUserId: true },
    });

    for (const member of members) {
      await prisma.$executeRaw`
        INSERT INTO "ChallengeParticipant" (id, "challengeId", "userId", "currentValue", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${challenge[0].id}, ${member.clientUserId}, 0, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;

      // Notify group members
      await notify({
        userId: member.clientUserId,
        type: "challenge_invite",
        title: "Nuevo desafío disponible",
        body: input.title,
        linkUrl: `/desafios/${challenge[0].id}`,
      });
    }
  }

  return { id: challenge[0].id };
}

/**
 * Get active challenges for a user
 */
export async function getActiveChallenges(userId: string) {
  const now = new Date();

  const challenges = await prisma.$queryRaw<Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    targetValue: number;
    unit: string;
    startDate: Date;
    endDate: Date | null;
    xpReward: number;
    participant_count: number;
    currentValue: number | null;
    completedAt: Date | null;
  }>>`
    SELECT 
      c.id, c.type, c.title, c.description, c."targetValue", c.unit, 
      c."startDate", c."endDate", c."xpReward",
      (SELECT COUNT(*) FROM "ChallengeParticipant" WHERE "challengeId" = c.id) as participant_count,
      cp."currentValue",
      cp."completedAt"
    FROM "Challenge" c
    LEFT JOIN "ChallengeParticipant" cp ON cp."challengeId" = c.id AND cp."userId" = ${userId}
    WHERE c."isActive" = true
      AND c."startDate" <= ${now}
      AND (c."endDate" IS NULL OR c."endDate" >= ${now})
      AND (c."isPublic" = true OR cp."userId" IS NOT NULL)
    ORDER BY c."startDate" DESC
  `;

  return challenges.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    description: c.description,
    targetValue: c.targetValue,
    unit: c.unit,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate?.toISOString() ?? null,
    xpReward: c.xpReward,
    participantCount: Number(c.participant_count),
    joined: c.currentValue !== null,
    progress: c.currentValue !== null
      ? {
          currentValue: c.currentValue,
          targetValue: c.targetValue,
          percentComplete: Math.min(100, (c.currentValue / c.targetValue) * 100),
          completed: c.completedAt !== null,
        }
      : null,
  }));
}

/**
 * Get user's challenge history (completed or expired)
 */
export async function getChallengeHistory(userId: string) {
  const now = new Date();

  const participations = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    type: string;
    targetValue: number;
    unit: string;
    currentValue: number;
    completedAt: Date | null;
    xpReward: number;
    rank: number | null;
  }>>`
    SELECT 
      c.id, c.title, c.type, c."targetValue", c.unit,
      cp."currentValue", cp."completedAt", c."xpReward", cp."rank"
    FROM "ChallengeParticipant" cp
    JOIN "Challenge" c ON c.id = cp."challengeId"
    WHERE cp."userId" = ${userId}
      AND (cp."completedAt" IS NOT NULL OR c."endDate" < ${now})
    ORDER BY cp."completedAt" DESC NULLS LAST
  `;

  return participations.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    targetValue: p.targetValue,
    unit: p.unit,
    currentValue: p.currentValue,
    percentComplete: Math.min(100, (p.currentValue / p.targetValue) * 100),
    completed: p.completedAt !== null,
    completedAt: p.completedAt?.toISOString() ?? null,
    xpReward: p.xpReward,
    rank: p.rank,
  }));
}

/**
 * Join a challenge
 */
export async function joinChallenge(userId: string, challengeId: string) {
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "ChallengeParticipant"
    WHERE "challengeId" = ${challengeId} AND "userId" = ${userId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    throw new Error("Ya estás participando en este desafío");
  }

  await prisma.$executeRaw`
    INSERT INTO "ChallengeParticipant" (id, "challengeId", "userId", "currentValue", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${challengeId}, ${userId}, 0, NOW(), NOW())
  `;
}

/**
 * Update challenge progress for a user
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  value: number
): Promise<{ completed: boolean; wasCompleted: boolean }> {
  const participation = await prisma.$queryRaw<Array<{
    id: string;
    currentValue: number;
    completedAt: Date | null;
    targetValue: number;
    title: string;
  }>>`
    SELECT cp.id, cp."currentValue", cp."completedAt", c."targetValue", c.title
    FROM "ChallengeParticipant" cp
    JOIN "Challenge" c ON c.id = cp."challengeId"
    WHERE cp."challengeId" = ${challengeId} AND cp."userId" = ${userId}
    LIMIT 1
  `;

  if (participation.length === 0) {
    throw new Error("No estás participando en este desafío");
  }

  const p = participation[0];
  const wasCompleted = p.completedAt !== null;
  const nowCompleted = value >= p.targetValue && !wasCompleted;

  await prisma.$executeRaw`
    UPDATE "ChallengeParticipant"
    SET "currentValue" = ${value},
        ${nowCompleted ? `"completedAt" = NOW(),` : ''}
        "updatedAt" = NOW()
    WHERE id = ${p.id}
  `;

  // Award XP and notify on completion
  if (nowCompleted) {
    await awardXpFromSource(userId, "COMPLETE_CHALLENGE");

    await notify({
      userId,
      type: "challenge_completed",
      title: "¡Desafío completado!",
      body: p.title,
      linkUrl: `/desafios/${challengeId}`,
    });
  }

  return { completed: nowCompleted || wasCompleted, wasCompleted };
}

/**
 * Get leaderboard for a challenge
 */
export async function getChallengeLeaderboard(challengeId: string, limit: number = 20) {
  const participants = await prisma.$queryRaw<Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    currentValue: number;
    completedAt: Date | null;
  }>>`
    SELECT 
      cp."userId",
      u."displayName" as name,
      u."avatarUrl",
      cp."currentValue",
      cp."completedAt"
    FROM "ChallengeParticipant" cp
    JOIN "User" u ON u.id = cp."userId"
    WHERE cp."challengeId" = ${challengeId}
    ORDER BY cp."currentValue" DESC, cp."completedAt" ASC
    LIMIT ${limit}
  `;

  return participants.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    name: p.name ?? "Usuario",
    avatarUrl: p.avatarUrl,
    currentValue: p.currentValue,
    completedAt: p.completedAt?.toISOString() ?? null,
  }));
}

/**
 * Calculate and update rankings for a challenge
 * Should be called periodically or when someone completes
 */
export async function updateChallengeRankings(challengeId: string) {
  const participants = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "ChallengeParticipant"
    WHERE "challengeId" = ${challengeId}
    ORDER BY "currentValue" DESC, "completedAt" ASC
  `;

  for (let i = 0; i < participants.length; i++) {
    await prisma.$executeRaw`
      UPDATE "ChallengeParticipant"
      SET "rank" = ${i + 1}
      WHERE id = ${participants[i].id}
    `;
  }
}
