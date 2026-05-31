import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  source: string;
  createdAt: Date;
}

export interface XpStats {
  currentXp: number;
  level: number;
  xpToNextLevel: number;
  progressPercent: number;
  totalXpEarned: number;
}

export interface XpActionResult {
  xpEarned: number;
  newTotal: number;
  newLevel: number;
  leveledUp: boolean;
}

// XP required for each level (exponential growth)
// Level 1: 0 XP needed (start here)
// Level 2: 100 XP
// Level 3: 250 XP
// Level 4: 450 XP
// etc.
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

export function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpNeeded = getXpForLevel(2);
  
  while (totalXp >= xpNeeded) {
    level++;
    totalXp -= xpNeeded;
    xpNeeded = getXpForLevel(level + 1);
  }
  
  return level;
}

export function getXpToNextLevel(currentXp: number, currentLevel: number): number {
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  const totalXpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpIntoCurrentLevel = currentXp - totalXpForCurrentLevel;
  
  return Math.max(0, xpForNextLevel - xpIntoCurrentLevel);
}

export function getProgressPercent(currentXp: number, currentLevel: number): number {
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  const totalXpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpIntoCurrentLevel = currentXp - totalXpForCurrentLevel;
  
  return Math.min(100, Math.floor((xpIntoCurrentLevel / xpForNextLevel) * 100));
}

// XP amounts for different actions
export const XP_REWARDS = {
  COMPLETE_WORKOUT: 50,
  COMPLETE_WORKOUT_WITH_HIGH_ENERGY: 75, // energyRating >= 4
  SET_PERSONAL_RECORD: 100,
  LOG_FOOD: 10,
  LOG_FOOD_STREAK_7: 50, // 7 day food logging streak
  ACHIEVE_STREAK_7: 100,
  ACHIEVE_STREAK_30: 300,
  UNLOCK_BADGE: 150,
  CONNECT_WEARABLE: 50,
  LOG_BODY_METRICS: 20,
  SET_HEALTH_GOAL: 25,
  COMPLETE_CHALLENGE: 200,
  INVITE_FRIEND: 25,
} as const;

export type XpSource = keyof typeof XP_REWARDS;

/**
 * Award XP to a user
 */
export async function awardXp(
  userId: string,
  amount: number,
  source: string,
  reason: string,
  sendNotification: boolean = true
): Promise<XpActionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true, displayName: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const oldLevel = user.level;
  const newTotalXp = user.xp + amount;
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > oldLevel;

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newTotalXp,
      level: newLevel,
    },
  });

  // Send notification for level up
  if (leveledUp && sendNotification) {
    await notify({
      userId,
      type: "level_up",
      title: "¡Subiste de nivel!",
      body: `Felicitaciones, alcanzaste el nivel ${newLevel}`,
      linkUrl: "/logros",
    });
  }

  return {
    xpEarned: amount,
    newTotal: newTotalXp,
    newLevel,
    leveledUp,
  };
}

/**
 * Award XP from a predefined source
 */
export async function awardXpFromSource(
  userId: string,
  source: XpSource,
  sendNotification: boolean = true
): Promise<XpActionResult> {
  const amount = XP_REWARDS[source];
  const reason = source.replace(/_/g, " ").toLowerCase();
  
  return awardXp(userId, amount, source, reason, sendNotification);
}

/**
 * Get user's XP stats
 */
export async function getXpStats(userId: string): Promise<XpStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    currentXp: user.xp,
    level: user.level,
    xpToNextLevel: getXpToNextLevel(user.xp, user.level),
    progressPercent: getProgressPercent(user.xp, user.level),
    totalXpEarned: user.xp,
  };
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  const titles = [
    { min: 1, max: 5, title: "Principiante" },
    { min: 6, max: 10, title: "Activado" },
    { min: 11, max: 20, title: "Entusiasta" },
    { min: 21, max: 30, title: "Atleta" },
    { min: 31, max: 40, title: "Comprometido" },
    { min: 41, max: 50, title: "Elite" },
    { min: 51, max: 75, title: "Experto" },
    { min: 76, max: 99, title: "Maestro" },
    { min: 100, max: Infinity, title: "Leyenda" },
  ];

  const title = titles.find((t) => level >= t.min && level <= t.max);
  return title?.title ?? "Principiante";
}
