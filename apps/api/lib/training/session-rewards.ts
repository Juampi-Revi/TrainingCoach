import { prisma } from "@/lib/prisma";
import { checkMultipleMetrics } from "@/lib/badge-checker";
import { awardXpFromSource } from "@/lib/gamification/xp.service";
import { updateWorkoutStreak } from "@/lib/gamification/streaks.service";
import { notifyCoachSessionCompleted } from "@/lib/training/session-notify";

async function getUserWorkoutCount(userId: string): Promise<number> {
  return prisma.workoutSession.count({
    where: { clientUserId: userId, status: "completed" },
  });
}

/** Side effects after a session is already saved. Must never fail the close. */
export async function awardCompletedSessionRewards(args: {
  userId: string;
  sessionId: string;
  workoutTitle: string | null;
  energyRating: number | null;
}): Promise<void> {
  try {
    await updateWorkoutStreak(args.userId);
    const xpSource = args.energyRating && args.energyRating >= 4
      ? "COMPLETE_WORKOUT_WITH_HIGH_ENERGY"
      : "COMPLETE_WORKOUT";
    await awardXpFromSource(args.userId, xpSource, false);

    const userStats = await prisma.user.findUnique({
      where: { id: args.userId },
      select: { currentWorkoutStreak: true },
    });
    const newBadges = await checkMultipleMetrics(args.userId, [
      { metric: "workouts_completed", value: await getUserWorkoutCount(args.userId) },
      { metric: "workout_streak", value: userStats?.currentWorkoutStreak ?? 0 },
    ]);
    for (const _badge of newBadges) {
      await awardXpFromSource(args.userId, "UNLOCK_BADGE", false);
    }

    await notifyCoachSessionCompleted({
      clientUserId: args.userId,
      sessionId: args.sessionId,
      workoutTitle: args.workoutTitle,
      energyRating: args.energyRating,
    });
  } catch (error) {
    console.error("[session-rewards] failed after session was saved", error);
  }
}
