import { MUSCLE_LABEL } from "@/lib/constants";

// ─── Domain types ────────────────────────────────────────────────────────────

export type HealthEntry = {
  id: string;
  day: string;
  steps: number | null;
  sleepMinutes: number | null;
  sportType: string | null;
  sportMinutes: number | null;
  notes: string | null;
  coachNotes: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string } }>;
};

export type MetricEntry = {
  id: string;
  measuredAt: string;
  weightKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  hipsCm: string | null;
  armCm: string | null;
  thighCm: string | null;
  notes: string | null;
};

export type FoodEntry = {
  id: string;
  loggedAt: string;
  text: string | null;
  photoUrl: string | null;
  source: string;
  mealType: string | null;
  quality: "good" | "regular" | "poor" | null;
  macroTags: string[];
  coachComments: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string | null } }>;
};

export type HealthGoal = {
  id: string;
  kind: string;
  targetInt: number | null;
  targetNumber: string | null;
  unit: string;
  period: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

export type WeeklySummary = {
  range: { start: string; end: string; days: number };
  health: { daysWithEntry: number; stepsTotal: number; sleepAvgMinutes: number | null; sportMinutesTotal: number };
  food: { count: number };
  workouts: { total: number; completed: number };
  latestWeight: { measuredAt: string; weightKg: string } | null;
};

export type SessionItem = {
  id: string;
  status: string;
  performedAt: string;
  workoutTemplate: { id: string; title: string; tags: string[] } | null;
  totalVolumeKg: number;
  setsCount: number;
};

export type TabKey = "Dashboard" | "Actividad" | "Sueño" | "Mediciones" | "Comidas" | "Entrenamientos";

// ─── Page-specific helpers ───────────────────────────────────────────────────

export function fmtSleep(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export function addDaysUTC(isoDay: string, deltaDays: number): string {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function muscleLabel(m: string): string {
  return MUSCLE_LABEL[m] ?? m;
}

export function goalLabel(kind: string): string {
  if (kind === "steps_daily") return "Pasos diarios";
  if (kind === "sleep_daily") return "Sueño diario";
  if (kind === "workouts_weekly") return "Entrenos semanales";
  return kind;
}

export function goalBadge(kind: string): { tone: "limeSoft" | "info" | "neutral"; icon: "chart" | "moon" | "dumbbell" | "star" } {
  if (kind === "steps_daily") return { tone: "limeSoft", icon: "chart" };
  if (kind === "sleep_daily") return { tone: "info", icon: "moon" };
  if (kind === "workouts_weekly") return { tone: "neutral", icon: "dumbbell" };
  return { tone: "neutral", icon: "star" };
}
