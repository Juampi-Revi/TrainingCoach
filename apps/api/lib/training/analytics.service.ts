import { prisma } from "@/lib/prisma";
import type { PersonalRecord, MuscleVolumeStats, WeeklyProgressSummary, ProgressDashboard } from "@regen/types";

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKeyUTC(date: Date): string {
  return startOfDayUTC(date).toISOString().slice(0, 10);
}

function estimate1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export async function getRecentPRs(userId: string, limit = 10): Promise<PersonalRecord[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: { clientUserId: userId, status: "completed" },
    orderBy: { performedAt: "desc" },
    take: 30,
    select: {
      id: true,
      performedAt: true,
      exercises: {
        select: {
          performedExercise: { select: { id: true, name: true } },
          sets: {
            where: { weight: { not: null }, reps: { not: null } },
            select: { reps: true, weight: true },
          },
        },
      },
    },
  });

  const prMap = new Map<string, PersonalRecord>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const exId = ex.performedExercise.id;
      const exName = ex.performedExercise.name;
      for (const set of ex.sets) {
        const reps = set.reps ?? 0;
        const weight = parseFloat(String(set.weight ?? 0));
        if (!reps || !weight) continue;
        const e1rm = estimate1RM(weight, reps);
        const existing = prMap.get(exId);
        if (!existing || e1rm > existing.estimated1rm) {
          prMap.set(exId, {
            id: `pr-${exId}-${dayKeyUTC(session.performedAt)}`,
            exerciseId: exId,
            exerciseName: exName,
            weight,
            reps,
            estimated1rm: e1rm,
            achievedAt: session.performedAt.toISOString(),
            sessionId: session.id,
          });
        }
      }
    }
  }
  return Array.from(prMap.values())
    .sort((a, b) => b.achievedAt.localeCompare(a.achievedAt))
    .slice(0, limit);
}

export async function getMuscleVolumeStats(userId: string, days = 30): Promise<MuscleVolumeStats[]> {
  const end = startOfDayUTC(new Date());
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const endExclusive = new Date(end.getTime() + 86_400_000);

  const sessions = await prisma.workoutSession.findMany({
    where: { clientUserId: userId, performedAt: { gte: start, lt: endExclusive }, status: "completed" },
    select: {
      exercises: {
        select: {
          performedExercise: { select: { primaryMuscle: true } },
          sets: { select: { id: true } },
        },
      },
    },
  });

  const byMuscle = new Map<string, MuscleVolumeStats>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const muscle = ex.performedExercise.primaryMuscle ?? "other";
      const prev = byMuscle.get(muscle) ?? { muscle, sets: 0, exercises: 0, trend: "stable" as const };
      prev.sets += ex.sets.length;
      prev.exercises += 1;
      byMuscle.set(muscle, prev);
    }
  }

  const result = Array.from(byMuscle.values()).sort((a, b) => b.sets - a.sets);

  if (result.length >= 2) {
    const lastWeekStart = new Date(end.getTime() - 13 * 86_400_000);
    const prevWeekStart = new Date(lastWeekStart.getTime() - 7 * 86_400_000);

    const [prevSessions, lastSessions] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { clientUserId: userId, performedAt: { gte: prevWeekStart, lt: lastWeekStart }, status: "completed" },
        select: { exercises: { select: { performedExercise: { select: { primaryMuscle: true } }, sets: { select: { id: true } } } } },
      }),
      prisma.workoutSession.findMany({
        where: { clientUserId: userId, performedAt: { gte: lastWeekStart, lt: end }, status: "completed" },
        select: { exercises: { select: { performedExercise: { select: { primaryMuscle: true } }, sets: { select: { id: true } } } } },
      }),
    ]);

    const prevSets = new Map<string, number>();
    for (const s of prevSessions) {
      for (const ex of s.exercises) {
        const m = ex.performedExercise.primaryMuscle ?? "other";
        prevSets.set(m, (prevSets.get(m) ?? 0) + ex.sets.length);
      }
    }

    for (const item of result) {
      const curr = item.sets;
      const prev = prevSets.get(item.muscle) ?? 0;
      if (curr > prev * 1.1) item.trend = "up";
      else if (curr < prev * 0.9) item.trend = "down";
      else item.trend = "stable";
    }
  } else {
    for (const item of result) {
      item.trend = "stable";
    }
  }

  return result;
}

export async function getWeeklyProgress(userId: string, weeks = 4): Promise<WeeklyProgressSummary[]> {
  const result: WeeklyProgressSummary[] = [];
  const now = new Date();

  for (let w = 0; w < weeks; w++) {
    const weekEnd = new Date(now.getTime() - w * 7 * 86_400_000);
    const weekStart = new Date(weekEnd.getTime() - 6 * 86_400_000);

    const sessions = await prisma.workoutSession.findMany({
      where: { clientUserId: userId, performedAt: { gte: weekStart, lt: weekEnd }, status: "completed" },
      select: {
        exercises: {
          select: {
            performedExercise: { select: { primaryMuscle: true } },
            sets: { select: { weight: true } },
          },
        },
      },
    });

    const muscleMap = new Map<string, { muscle: string; sets: number; exercises: number }>();
    let totalSets = 0;
    let totalVolume = 0;

    for (const s of sessions) {
      for (const ex of s.exercises) {
        totalSets += ex.sets.length;
        for (const set of ex.sets) {
          const w = parseFloat(String(set.weight ?? 0));
          if (w > 0) totalVolume += w;
        }
        const muscle = ex.performedExercise.primaryMuscle ?? "other";
        const prev = muscleMap.get(muscle) ?? { muscle, sets: 0, exercises: 0 };
        prev.sets += ex.sets.length;
        prev.exercises += 1;
        muscleMap.set(muscle, prev);
      }
    }

    const prs = await getRecentPRs(userId, 50);
    const weekPrs = prs.filter(p => {
      const d = new Date(p.achievedAt);
      return d >= weekStart && d < weekEnd;
    }).length;

    const topMuscles = Array.from(muscleMap.values())
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 5)
      .map(m => ({ ...m, trend: "stable" as const }));

    result.push({
      weekNumber: w + 1,
      totalWorkouts: sessions.length,
      totalSets,
      totalVolume: Math.round(totalVolume),
      prsCount: weekPrs,
      topMuscles,
    });
  }

  return result.reverse();
}

export async function getProgressDashboard(userId: string): Promise<ProgressDashboard> {
  const [recentPRs, muscleVolume, weeklyProgress] = await Promise.all([
    getRecentPRs(userId, 10),
    getMuscleVolumeStats(userId, 30),
    getWeeklyProgress(userId, 4),
  ]);

  const currentWeek = weeklyProgress[weeklyProgress.length - 1];
  const previousWeek = weeklyProgress[weeklyProgress.length - 2];

  return {
    recentPRs,
    muscleVolume,
    weeklyProgress,
    comparisonVsLastWeek: {
      workoutsDelta: (currentWeek?.totalWorkouts ?? 0) - (previousWeek?.totalWorkouts ?? 0),
      volumeDelta: (currentWeek?.totalVolume ?? 0) - (previousWeek?.totalVolume ?? 0),
      prsDelta: (currentWeek?.prsCount ?? 0) - (previousWeek?.prsCount ?? 0),
    },
  };
}