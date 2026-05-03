import type { SessionSummary } from "@regen/types";

export interface ClientDetail {
  id: string;
  name: string | null;
  email: string;
  assignment: {
    status: string;
    plan: { id: string; title: string; weeksCount: number } | null;
    weekNumber?: number;
  } | null;
  recentSessions: SessionSummary[];
  weightHistory: { recordedAt: string; weight: number }[];
}

export interface ApiClientResponse {
  client: { id: string; name: string | null; email: string; assignment: ClientDetail["assignment"] };
  recentSessions: SessionSummary[];
  weightHistory: { measuredAt: string; weightKg: string | null }[];
}

export interface HealthEntry {
  id: string;
  day: string;
  steps: number | null;
  sleepMinutes: number | null;
  sportType: string | null;
  sportMinutes: number | null;
  notes: string | null;
}

export interface HealthMetric {
  id: string;
  measuredAt: string;
  weightKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  hipsCm: string | null;
  armCm: string | null;
  thighCm: string | null;
  notes: string | null;
}

export interface CoachNote {
  id: string;
  day: string;
  text: string;
  createdAt: string;
  coach: { id: string; name: string };
}

export interface HealthData {
  entries: HealthEntry[];
  metrics: HealthMetric[];
  coachNotes: CoachNote[];
}

export interface FoodCoachComment {
  id: string;
  text: string;
  createdAt: string;
  coach: { id: string; name: string | null };
}

export interface FoodItem {
  id: string;
  loggedAt: string;
  text: string | null;
  photoUrl: string | null;
  source: string;
  coachComments: FoodCoachComment[];
}

export interface GoalItem {
  id: string;
  kind: string;
  targetInt: number | null;
  targetNumber: string | null;
  unit: string;
  period: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface WeeklySummary {
  range: { start: string; end: string; days: number };
  health: { daysWithEntry: number; stepsTotal: number; sleepAvgMinutes: number | null; sportMinutesTotal: number };
  food: { count: number };
  workouts: { total: number; completed: number };
  latestWeight: { measuredAt: string; weightKg: string } | null;
}
