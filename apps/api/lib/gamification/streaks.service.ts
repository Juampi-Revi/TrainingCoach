import { prisma } from "@/lib/prisma";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  streakActive: boolean;
}

// Streak is considered active if last workout was today or yesterday
const STREAK_GRACE_HOURS = 36; // Allow streak to continue if workout was within 36 hours

/**
 * Check if a streak is currently active
 */
export function isStreakActive(lastWorkoutDate: Date | null): boolean {
  if (!lastWorkoutDate) return false;
  
  const now = new Date();
  const hoursSinceLastWorkout = (now.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastWorkout <= STREAK_GRACE_HOURS;
}

/**
 * Calculate days between two dates (ignoring time)
 */
function daysBetween(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Update user's workout streak when they complete a workout
 * This should be called after a session is marked as completed
 */
export async function updateWorkoutStreak(userId: string): Promise<StreakStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();
  
  // Get streak data from user record (stored as part of gamification fields)
  const userWithStreak = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
    },
  });

  // For now, we calculate streak from recent workout sessions
  // This is a simplified version - in production, you'd store streak separately
  const recentSessions = await prisma.workoutSession.findMany({
    where: {
      clientUserId: userId,
      status: "completed",
    },
    orderBy: { completedAt: "desc" },
    take: 100,
    select: { completedAt: true },
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let lastWorkoutDate: Date | null = null;

  if (recentSessions.length > 0 && recentSessions[0].completedAt) {
    lastWorkoutDate = recentSessions[0].completedAt;
    
    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueDays = new Set<string>();
    for (const session of recentSessions) {
      if (session.completedAt) {
        const date = new Date(session.completedAt);
        date.setHours(0, 0, 0, 0);
        uniqueDays.add(date.toISOString().split('T')[0]);
      }
    }
    
    const sortedDays = Array.from(uniqueDays).sort().reverse();
    
    // Count consecutive days from most recent
    for (let i = 0; i < sortedDays.length; i++) {
      const day = new Date(sortedDays[i]);
      const expectedDay = new Date(today);
      expectedDay.setDate(expectedDay.getDate() - i);
      
      if (day.toISOString().split('T')[0] === expectedDay.toISOString().split('T')[0]) {
        currentStreak++;
      } else if (i === 0) {
        // Check if within grace period
        const lastDay = new Date(sortedDays[0]);
        const hoursDiff = (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60);
        if (hoursDiff <= 36) {
          currentStreak = 1;
          for (let j = 1; j < sortedDays.length; j++) {
            const prevDay = new Date(sortedDays[j]);
            const expectedPrev = new Date(lastDay);
            expectedPrev.setDate(expectedPrev.getDate() - j);
            if (prevDay.toISOString().split('T')[0] === expectedPrev.toISOString().split('T')[0]) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
        break;
      } else {
        break;
      }
    }
    
    // Calculate longest streak (simplified)
    longestStreak = Math.max(currentStreak, Math.floor(recentSessions.length / 3));
  }

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: lastWorkoutDate?.toISOString() ?? null,
    streakActive: isStreakActive(lastWorkoutDate),
  };
}

/**
 * Get user's current streak stats without modifying them
 */
export async function getStreakStats(userId: string): Promise<StreakStats> {
  return updateWorkoutStreak(userId);
}

/**
 * Reset streak if it has been inactive for too long
 * Should be called periodically (e.g., by a cron job or on user login)
 */
export async function checkAndResetInactiveStreaks(userId: string): Promise<StreakStats | null> {
  const stats = await getStreakStats(userId);
  
  if (!stats.streakActive && stats.currentStreak > 0) {
    // Streak has expired
    return {
      ...stats,
      currentStreak: 0,
      streakActive: false,
    };
  }

  return stats;
}

/**
 * Get streak milestones (for badges/achievements)
 */
export function getStreakMilestones(): number[] {
  return [3, 7, 14, 30, 60, 100, 180, 365];
}

/**
 * Check if a streak reached a milestone
 */
export function checkStreakMilestone(streak: number): number | null {
  const milestones = getStreakMilestones();
  if (milestones.includes(streak)) {
    return streak;
  }
  return null;
}
