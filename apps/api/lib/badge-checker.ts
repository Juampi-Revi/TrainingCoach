import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push-notifications";
import { BADGE_DEFINITIONS, getBadgeById, type BadgeDefinition } from "@/lib/badges";

interface BadgeCheckContext {
  userId: string;
  metric: string;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * Check if user has earned any badges based on the metric and value
 * This should be called after relevant actions (workout completion, steps logged, etc.)
 */
export async function checkAndAwardBadges(context: BadgeCheckContext): Promise<BadgeDefinition[]> {
  const { userId, metric, value } = context;

  // Get user's current badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });

  const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  // Find badges that match the metric and haven't been unlocked yet
  const potentialBadges = BADGE_DEFINITIONS.filter(
    (badge) =>
      badge.requirement.metric === metric && !unlockedBadgeIds.has(badge.id)
  );

  const newlyUnlocked: BadgeDefinition[] = [];

  for (const badge of potentialBadges) {
    let shouldUnlock = false;

    switch (badge.requirement.type) {
      case "count":
        shouldUnlock = value >= badge.requirement.target;
        break;
      case "streak":
        shouldUnlock = value >= badge.requirement.target;
        break;
      case "days":
        shouldUnlock = value >= badge.requirement.target;
        break;
    }

    if (shouldUnlock) {
      // Award badge
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });

      newlyUnlocked.push(badge);

      // Send push notification
      await sendPushNotification(userId, {
        title: "¡Nuevo logro desbloqueado! 🏆",
        body: `Has desbloqueado: ${badge.name}`,
        tag: "badge_unlocked",
        data: {
          url: "/cuenta/badges",
          type: "badge",
          badgeId: badge.id,
        },
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Check multiple metrics at once (useful for batch processing or dashboard load)
 */
export async function checkMultipleMetrics(
  userId: string,
  metrics: Array<{ metric: string; value: number }>
): Promise<BadgeDefinition[]> {
  const allUnlocked: BadgeDefinition[] = [];

  for (const { metric, value } of metrics) {
    const unlocked = await checkAndAwardBadges({ userId, metric, value });
    allUnlocked.push(...unlocked);
  }

  return allUnlocked;
}

/**
 * Get stats for badge progress (e.g., "5/10 workouts completed")
 */
export function getBadgeProgress(badgeId: string, currentValue: number): string {
  const badge = getBadgeById(badgeId);
  if (!badge) return "";

  const percentage = Math.min(100, Math.round((currentValue / badge.requirement.target) * 100));
  return `${percentage}%`;
}
