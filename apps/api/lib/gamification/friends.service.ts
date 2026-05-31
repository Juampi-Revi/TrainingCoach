import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export interface FriendProfile {
  userId: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  currentStreak: number;
  isFollowing: boolean;
}

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error("No podés seguirte a vos mismo");
  }
  
  // Check if already following
  const existing = await prisma.$queryRaw<[{ id: string }]>`
    SELECT id FROM "UserFollow"
    WHERE "followerId" = ${followerId} AND "followingId" = ${followingId}
    LIMIT 1
  `;
  
  if (existing.length > 0) {
    throw new Error("Ya seguís a este usuario");
  }
  
  // Create follow relationship
  await prisma.$executeRaw`
    INSERT INTO "UserFollow" (id, "followerId", "followingId", "createdAt")
    VALUES (gen_random_uuid(), ${followerId}, ${followingId}, NOW())
  `;
  
  // Notify the user being followed
  await notify({
    userId: followingId,
    type: "new_follower",
    title: "Nuevo seguidor",
    body: "Alguien comenzó a seguirte",
    linkUrl: "/logros",
  });
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "UserFollow"
    WHERE "followerId" = ${followerId} AND "followingId" = ${followingId}
  `;
}

/**
 * Get user's friends (people they follow)
 */
export async function getFriends(userId: string): Promise<FriendProfile[]> {
  const friends = await prisma.$queryRaw<Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    level: number;
    streak: number;
  }>>`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      u.level,
      COALESCE(streak_data.streak, 0)::int as streak
    FROM "UserFollow" uf
    JOIN "User" u ON u.id = uf."followingId"
    LEFT JOIN (
      SELECT 
        "clientUserId",
        COUNT(DISTINCT DATE("completedAt")) as streak
      FROM "WorkoutSession"
      WHERE status = 'completed'
        AND "completedAt" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY "clientUserId"
    ) streak_data ON streak_data."clientUserId" = u.id
    WHERE uf."followerId" = ${userId}
    ORDER BY u."displayName" ASC
  `;
  
  return friends.map((f) => ({
    userId: f.userId,
    name: f.name ?? "Usuario",
    avatarUrl: f.avatarUrl,
    level: f.level,
    currentStreak: f.streak,
    isFollowing: true,
  }));
}

/**
 * Get user's followers
 */
export async function getFollowers(userId: string): Promise<FriendProfile[]> {
  const followers = await prisma.$queryRaw<Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    level: number;
    streak: number;
    isFollowing: boolean;
  }>>`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      u.level,
      COALESCE(streak_data.streak, 0)::int as streak,
      EXISTS (
        SELECT 1 FROM "UserFollow" uf2 
        WHERE uf2."followerId" = ${userId} 
        AND uf2."followingId" = u.id
      ) as "isFollowing"
    FROM "UserFollow" uf
    JOIN "User" u ON u.id = uf."followerId"
    LEFT JOIN (
      SELECT 
        "clientUserId",
        COUNT(DISTINCT DATE("completedAt")) as streak
      FROM "WorkoutSession"
      WHERE status = 'completed'
        AND "completedAt" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY "clientUserId"
    ) streak_data ON streak_data."clientUserId" = u.id
    WHERE uf."followingId" = ${userId}
    ORDER BY u."displayName" ASC
  `;
  
  return followers.map((f) => ({
    userId: f.userId,
    name: f.name ?? "Usuario",
    avatarUrl: f.avatarUrl,
    level: f.level,
    currentStreak: f.streak,
    isFollowing: f.isFollowing,
  }));
}

/**
 * Search for users to follow
 */
export async function searchUsers(
  currentUserId: string,
  query: string,
  limit: number = 10
): Promise<FriendProfile[]> {
  const searchTerm = `%${query}%`;
  
  const users = await prisma.$queryRaw<Array<{
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    level: number;
    isFollowing: boolean;
  }>>`
    SELECT 
      u.id as "userId",
      u."displayName" as name,
      u."avatarUrl",
      u.level,
      EXISTS (
        SELECT 1 FROM "UserFollow" uf 
        WHERE uf."followerId" = ${currentUserId} 
        AND uf."followingId" = u.id
      ) as "isFollowing"
    FROM "User" u
    WHERE u.id != ${currentUserId}
      AND u.role = 'client'
      AND (
        u."displayName" ILIKE ${searchTerm}
        OR u.email ILIKE ${searchTerm}
      )
    LIMIT ${limit}
  `;
  
  return users.map((u) => ({
    userId: u.userId,
    name: u.name ?? "Usuario",
    avatarUrl: u.avatarUrl,
    level: u.level,
    currentStreak: 0,
    isFollowing: u.isFollowing,
  }));
}

/**
 * Get friend count
 */
export async function getFriendCounts(userId: string): Promise<{
  following: number;
  followers: number;
}> {
  const result = await prisma.$queryRaw<[{ following: number; followers: number }]>`
    SELECT 
      (SELECT COUNT(*)::int FROM "UserFollow" WHERE "followerId" = ${userId}) as following,
      (SELECT COUNT(*)::int FROM "UserFollow" WHERE "followingId" = ${userId}) as followers
  `;
  
  return result[0] ?? { following: 0, followers: 0 };
}