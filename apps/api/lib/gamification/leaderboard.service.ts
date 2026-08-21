import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LeaderboardPeriod = "weekly" | "monthly" | "allTime";
export type LeaderboardMetric = "workouts" | "volume" | "xp" | "streak";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  value: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserValue: number | null;
  totalParticipants: number;
}

function userIdList(userIds: string[]) {
  return Prisma.join(userIds);
}

interface DateRange {
  start: Date;
  end: Date;
}

function getDateRange(period: LeaderboardPeriod): DateRange {
  const now = new Date();
  const end = new Date(now);
  
  let start: Date;
  
  switch (period) {
    case "weekly":
      // Start of current week (Monday)
      start = new Date(now);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
      
    case "monthly":
      // Start of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
      
    case "allTime":
      // Beginning of time (for all-time leaderboards)
      start = new Date(0);
      break;
      
    default:
      start = new Date(0);
  }
  
  return { start, end };
}

/**
 * Get leaderboard for a specific metric and period
 */
export async function getLeaderboard(
  currentUserId: string,
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
  limit: number = 20
): Promise<LeaderboardResult> {
  const { start, end } = getDateRange(period);
  
  let entries: Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    value: number;
  }> = [];
  
  switch (metric) {
    case "workouts":
      entries = await getWorkoutsLeaderboard(start, end, limit);
      break;
      
    case "volume":
      entries = await getVolumeLeaderboard(start, end, limit);
      break;
      
    case "xp":
      entries = await getXpLeaderboard(limit);
      break;
      
    case "streak":
      entries = await getStreakLeaderboard(limit);
      break;
  }
  
  // Find current user's rank and value
  let currentUserRank: number | null = null;
  let currentUserValue: number | null = null;
  
  const currentUserEntry = entries.find((e) => e.userId === currentUserId);
  if (currentUserEntry) {
    currentUserRank = entries.indexOf(currentUserEntry) + 1;
    currentUserValue = currentUserEntry.value;
  } else {
    // Current user not in top, fetch their stats separately
    const userStats = await getUserMetricValue(currentUserId, metric, start, end);
    currentUserValue = userStats;
    
    // Calculate their rank by counting how many users have higher values
    const higherCount = await getRankForValue(metric, userStats, start, end);
    currentUserRank = higherCount + 1;
  }
  
  // Get total participants
  const totalParticipants = await getTotalParticipants(metric, start, end);
  
  return {
    entries: entries.map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      name: e.name ?? "Usuario",
      avatarUrl: e.avatarUrl,
      value: e.value,
      isCurrentUser: e.userId === currentUserId,
    })),
    currentUserRank,
    currentUserValue,
    totalParticipants,
  };
}

/**
 * Get leaderboard filtered by friends only
 */
export async function getFriendsLeaderboard(
  currentUserId: string,
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
  limit: number = 20
): Promise<LeaderboardResult> {
  const { start, end } = getDateRange(period);
  
  // Get all friends (following)
  const friends = await prisma.$queryRaw<Array<{ followingId: string }>>`
    SELECT "followingId" FROM "UserFollow"
    WHERE "followerId" = ${currentUserId}
  `;
  
  const friendIds = friends.map((f) => f.followingId);
  // Include current user in the list
  friendIds.push(currentUserId);
  
  let entries: Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    value: number;
  }> = [];
  
  switch (metric) {
    case "workouts":
      entries = await getWorkoutsLeaderboardForUsers(friendIds, start, end);
      break;
      
    case "volume":
      entries = await getVolumeLeaderboardForUsers(friendIds, start, end);
      break;
      
    case "xp":
      entries = await getXpLeaderboardForUsers(friendIds);
      break;
      
    case "streak":
      entries = await getStreakLeaderboardForUsers(friendIds);
      break;
  }
  
  // Sort by value descending
  entries.sort((a, b) => b.value - a.value);
  
  // Find current user's rank
  const currentUserEntry = entries.find((e) => e.userId === currentUserId);
  const currentUserRank = currentUserEntry ? entries.indexOf(currentUserEntry) + 1 : null;
  const currentUserValue = currentUserEntry?.value ?? null;
  
  return {
    entries: entries.slice(0, limit).map((e, index) => ({
      rank: index + 1,
      userId: e.userId,
      name: e.name ?? "Usuario",
      avatarUrl: e.avatarUrl,
      value: e.value,
      isCurrentUser: e.userId === currentUserId,
    })),
    currentUserRank,
    currentUserValue,
    totalParticipants: entries.length,
  };
}

// Helper functions for each metric

async function getWorkoutsLeaderboard(
  start: Date,
  end: Date,
  limit: number
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      COUNT(ws.id)::int as value
    FROM "User" u
    JOIN "WorkoutSession" ws ON ws."clientUserId" = u.id
    WHERE ws.status = 'completed'
      AND ws."completedAt" >= ${start}
      AND ws."completedAt" <= ${end}
    GROUP BY u.id, u."displayName", u."avatarUrl"
    ORDER BY value DESC
    LIMIT ${limit}
  `;
}

async function getWorkoutsLeaderboardForUsers(
  userIds: string[],
  start: Date,
  end: Date
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  if (userIds.length === 0) return [];
  
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      COUNT(ws.id)::int as value
    FROM "User" u
    LEFT JOIN "WorkoutSession" ws ON ws."clientUserId" = u.id
      AND ws.status = 'completed'
      AND ws."completedAt" >= ${start}
      AND ws."completedAt" <= ${end}
    WHERE u.id IN (${userIdList(userIds)})
    GROUP BY u.id, u."displayName", u."avatarUrl"
  `;
}

async function getVolumeLeaderboard(
  start: Date,
  end: Date,
  limit: number
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      COALESCE(SUM(ws_total.volume), 0)::int as value
    FROM "User" u
    JOIN (
      SELECT ws."clientUserId", SUM(wset.weight * wset.reps) as volume
      FROM "WorkoutSession" ws
      JOIN "WorkoutSessionExercise" wse ON wse."workoutSessionId" = ws.id
      JOIN "WorkoutSet" wset ON wset."workoutSessionExerciseId" = wse.id
      WHERE ws.status = 'completed'
        AND ws."completedAt" >= ${start}
        AND ws."completedAt" <= ${end}
        AND wset.weight IS NOT NULL
        AND wset.reps IS NOT NULL
      GROUP BY ws.id
    ) ws_total ON ws_total."clientUserId" = u.id
    GROUP BY u.id, u."displayName", u."avatarUrl"
    ORDER BY value DESC
    LIMIT ${limit}
  `;
}

async function getVolumeLeaderboardForUsers(
  userIds: string[],
  start: Date,
  end: Date
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  if (userIds.length === 0) return [];
  
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      COALESCE(SUM(wset.weight * wset.reps), 0)::int as value
    FROM "User" u
    LEFT JOIN "WorkoutSession" ws ON ws."clientUserId" = u.id
      AND ws.status = 'completed'
      AND ws."completedAt" >= ${start}
      AND ws."completedAt" <= ${end}
    LEFT JOIN "WorkoutSessionExercise" wse ON wse."workoutSessionId" = ws.id
    LEFT JOIN "WorkoutSet" wset ON wset."workoutSessionExerciseId" = wse.id
      AND wset.weight IS NOT NULL
      AND wset.reps IS NOT NULL
    WHERE u.id IN (${userIdList(userIds)})
    GROUP BY u.id, u."displayName", u."avatarUrl"
  `;
}

async function getXpLeaderboard(
  limit: number
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      u.xp as value
    FROM "User" u
    WHERE u.xp > 0
    ORDER BY u.xp DESC
    LIMIT ${limit}
  `;
}

async function getXpLeaderboardForUsers(
  userIds: string[]
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  if (userIds.length === 0) return [];
  
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      u.xp as value
    FROM "User" u
    WHERE u.id IN (${userIdList(userIds)})
    ORDER BY u.xp DESC
  `;
}

async function getStreakLeaderboard(
  limit: number
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  // Calculate current streak from recent sessions
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      COALESCE(streak_data.streak, 0)::int as value
    FROM "User" u
    LEFT JOIN (
      SELECT 
        "clientUserId",
        COUNT(DISTINCT DATE("completedAt")) as streak
      FROM "WorkoutSession"
      WHERE status = 'completed'
        AND "completedAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "clientUserId"
    ) streak_data ON streak_data."clientUserId" = u.id
    ORDER BY value DESC
    LIMIT ${limit}
  `;
}

async function getStreakLeaderboardForUsers(
  userIds: string[]
): Promise<Array<{ userId: string; name: string | null; avatarUrl: string | null; value: number }>> {
  if (userIds.length === 0) return [];
  
  return prisma.$queryRaw`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      COALESCE(streak_data.streak, 0)::int as value
    FROM "User" u
    LEFT JOIN (
      SELECT 
        "clientUserId",
        COUNT(DISTINCT DATE("completedAt")) as streak
      FROM "WorkoutSession"
      WHERE status = 'completed'
        AND "completedAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "clientUserId"
    ) streak_data ON streak_data."clientUserId" = u.id
    WHERE u.id IN (${userIdList(userIds)})
  `;
}

async function getUserMetricValue(
  userId: string,
  metric: LeaderboardMetric,
  start: Date,
  end: Date
): Promise<number> {
  switch (metric) {
    case "workouts": {
      const result = await prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM "WorkoutSession"
        WHERE "clientUserId" = ${userId}
          AND status = 'completed'
          AND "completedAt" >= ${start}
          AND "completedAt" <= ${end}
      `;
      return result[0]?.count ?? 0;
    }
    
    case "volume": {
      const result = await prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(wset.weight * wset.reps), 0)::int as total
        FROM "WorkoutSession" ws
        JOIN "WorkoutSessionExercise" wse ON wse."workoutSessionId" = ws.id
        JOIN "WorkoutSet" wset ON wset."workoutSessionExerciseId" = wse.id
        WHERE ws."clientUserId" = ${userId}
          AND ws.status = 'completed'
          AND ws."completedAt" >= ${start}
          AND ws."completedAt" <= ${end}
          AND wset.weight IS NOT NULL
          AND wset.reps IS NOT NULL
      `;
      return result[0]?.total ?? 0;
    }
    
    case "xp": {
      const result = await prisma.$queryRaw<[{ xp: number }]>`
        SELECT xp FROM "User" WHERE id = ${userId}
      `;
      return result[0]?.xp ?? 0;
    }
    
    case "streak": {
      const result = await prisma.$queryRaw<[{ streak: number }]>`
        SELECT COUNT(DISTINCT DATE("completedAt"))::int as streak
        FROM "WorkoutSession"
        WHERE "clientUserId" = ${userId}
          AND status = 'completed'
          AND "completedAt" >= CURRENT_DATE - INTERVAL '30 days'
      `;
      return result[0]?.streak ?? 0;
    }
    
    default:
      return 0;
  }
}

async function getRankForValue(
  metric: LeaderboardMetric,
  value: number,
  start: Date,
  end: Date
): Promise<number> {
  if (value === 0) return 0;
  
  let result: [{ count: number }] = [{ count: 0 }];
  
  switch (metric) {
    case "workouts":
      result = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT "clientUserId")::int as count
        FROM "WorkoutSession"
        WHERE status = 'completed'
          AND "completedAt" >= ${start}
          AND "completedAt" <= ${end}
        GROUP BY "clientUserId"
        HAVING COUNT(*) > ${value}
      `;
      break;
      
    case "volume":
      // Simplified - complex query
      result = [{ count: 0 }];
      break;
      
    case "xp":
      result = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM "User"
        WHERE xp > ${value}
      `;
      break;
      
    case "streak":
      result = [{ count: 0 }];
      break;
  }
  
  return result[0]?.count ?? 0;
}

async function getTotalParticipants(
  metric: LeaderboardMetric,
  start: Date,
  end: Date
): Promise<number> {
  let result: [{ count: number }] = [{ count: 0 }];
  
  switch (metric) {
    case "workouts":
    case "volume":
      result = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT "clientUserId")::int as count
        FROM "WorkoutSession"
        WHERE status = 'completed'
          AND "completedAt" >= ${start}
          AND "completedAt" <= ${end}
      `;
      break;
      
    case "xp":
      result = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM "User"
        WHERE xp > 0
      `;
      break;
      
    case "streak":
      result = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT "clientUserId")::int as count
        FROM "WorkoutSession"
        WHERE status = 'completed'
          AND "completedAt" >= CURRENT_DATE - INTERVAL '30 days'
      `;
      break;
  }
  
  return result[0]?.count ?? 0;
}
