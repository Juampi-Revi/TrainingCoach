// lib/dashboard-calculations.ts — helpers para calcular métricas del dashboard

import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekBounds {
  start: Date;
  end: Date;
}

interface WorkoutWithType {
  type: string;
  energyRating: number | null;
  performedAt: Date;
}

interface HealthEntry {
  day: Date;
  steps: number | null;
  sleepMinutes: number | null;
}

interface SessionWithEnergy {
  energyRating: number | null;
  performedAt: Date;
}

// ─── Week utilities ───────────────────────────────────────────────────────────

export function getCurrentWeekBounds(now = new Date()): WeekBounds {
  const dayOfWeek = (now.getUTCDay() + 6) % 7; // Mon=0, Sun=6
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek),
  );
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

export function getPreviousWeekBounds(now = new Date()): WeekBounds {
  const current = getCurrentWeekBounds(now);
  const start = new Date(current.start.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = current.start;
  return { start, end };
}

// ─── Score calculation ────────────────────────────────────────────────────────

export function calculateWeekScore(
  workoutsCompleted: number,
  workoutsTarget: number | null,
  energyAvg: number | null,
): number {
  let adherenceComponent = 0;
  if (workoutsTarget !== null && workoutsTarget > 0) {
    adherenceComponent = Math.min(60, (workoutsCompleted / workoutsTarget) * 60);
  }

  let energyComponent = 20; // default when no data
  if (energyAvg !== null) {
    energyComponent = Math.min(40, (energyAvg / 5) * 40);
  }

  return Math.round(adherenceComponent + energyComponent);
}

// ─── Workout type classification ──────────────────────────────────────────────

function isStrengthType(type: string | null): boolean {
  return type === "strength" || type === null;
}

export function classifyWorkouts(workouts: WorkoutWithType[]): {
  strength: number;
  cardio: number;
} {
  let strength = 0;
  let cardio = 0;
  for (const w of workouts) {
    if (isStrengthType(w.type)) {
      strength++;
    } else {
      cardio++;
    }
  }
  return { strength, cardio };
}

// ─── Target calculation ───────────────────────────────────────────────────────

export function calculateWeekTargets(
  assignment: {
    startDate: Date | null;
    plan: {
      weeks: { weekNumber: number; workouts: { id: string; type?: string }[] }[];
    };
  } | null,
  currentWeekNumber: number,
): {
  totalTarget: number | null;
  strengthTarget: number | null;
  cardioTarget: number | null;
} {
  if (!assignment?.plan.weeks.length) {
    return { totalTarget: null, strengthTarget: null, cardioTarget: null };
  }

  // Find the current week in the plan
  let planWeek = assignment.plan.weeks.find((w) => w.weekNumber === currentWeekNumber);

  // Fallback to last week if plan ended but assignment still active
  if (!planWeek) {
    planWeek = assignment.plan.weeks[assignment.plan.weeks.length - 1];
  }

  if (!planWeek) {
    return { totalTarget: null, strengthTarget: null, cardioTarget: null };
  }

  const totalTarget = planWeek.workouts.length;
  
  // Count strength vs cardio in the week's workouts
  let strengthTarget = 0;
  let cardioTarget = 0;
  for (const w of planWeek.workouts) {
    if (isStrengthType(w.type ?? "strength")) {
      strengthTarget++;
    } else {
      cardioTarget++;
    }
  }

  return { totalTarget, strengthTarget, cardioTarget };
}

export function calculateCurrentWeekNumber(
  startDate: Date | null,
  weekStart: Date,
): number {
  if (!startDate) return 1;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const elapsedMs = weekStart.getTime() - startDate.getTime();
  return Math.max(1, Math.floor(elapsedMs / msPerWeek) + 1);
}

// ─── Daily arrays builders ────────────────────────────────────────────────────

export function buildDailyArrays(
  healthEntries: HealthEntry[],
  sessions: SessionWithEnergy[],
  weekStart: Date,
): {
  dailySteps: (number | null)[];
  dailySleepMinutes: (number | null)[];
  dailyEnergy: (number | null)[];
  dailyWorkouts: number[];
} {
  const dailySteps: (number | null)[] = Array(7).fill(null);
  const dailySleepMinutes: (number | null)[] = Array(7).fill(null);
  const dailyEnergy: (number | null)[] = Array(7).fill(null);
  const dailyWorkouts: number[] = Array(7).fill(0);

  // Map health entries to day index (0=Mon, 6=Sun)
  for (const entry of healthEntries) {
    const entryDate = new Date(entry.day);
    const dayDiff = Math.floor(
      (entryDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (dayDiff >= 0 && dayDiff < 7) {
      dailySteps[dayDiff] = entry.steps ?? null;
      dailySleepMinutes[dayDiff] = entry.sleepMinutes ?? null;
    }
  }

  // Map session energy ratings and workout counts to day index
  for (const session of sessions) {
    const sessionDate = new Date(session.performedAt);
    const dayDiff = Math.floor(
      (sessionDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (dayDiff >= 0 && dayDiff < 7) {
      // Count workouts per day
      dailyWorkouts[dayDiff] += 1;

      // Energy: if multiple sessions on same day, use the average
      if (session.energyRating !== null) {
        const existing = dailyEnergy[dayDiff];
        if (existing === null) {
          dailyEnergy[dayDiff] = session.energyRating;
        } else {
          dailyEnergy[dayDiff] = Math.round((existing + session.energyRating) / 2);
        }
      }
    }
  }

  return { dailySteps, dailySleepMinutes, dailyEnergy, dailyWorkouts };
}

// ─── Average calculations ─────────────────────────────────────────────────────

export function calculateAverages(
  healthEntries: HealthEntry[],
  sessions: SessionWithEnergy[],
): {
  stepsAvg: number | null;
  sleepMinutesAvg: number | null;
  energyAvg: number | null;
} {
  const entriesWithSteps = healthEntries.filter((e) => e.steps !== null);
  const stepsAvg =
    entriesWithSteps.length > 0
      ? entriesWithSteps.reduce((sum, e) => sum + (e.steps as number), 0) /
        entriesWithSteps.length
      : null;

  const entriesWithSleep = healthEntries.filter((e) => e.sleepMinutes !== null);
  const sleepMinutesAvg =
    entriesWithSleep.length > 0
      ? entriesWithSleep.reduce((sum, e) => sum + (e.sleepMinutes as number), 0) /
        entriesWithSleep.length
      : null;

  const sessionsWithEnergy = sessions.filter((s) => s.energyRating !== null);
  const energyAvg =
    sessionsWithEnergy.length > 0
      ? sessionsWithEnergy.reduce((sum, s) => sum + (s.energyRating as number), 0) /
        sessionsWithEnergy.length
      : null;

  return { stepsAvg, sleepMinutesAvg, energyAvg };
}