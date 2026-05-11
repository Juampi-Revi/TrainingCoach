export interface CellData {
  pwwId: string;
  templateId: string;
  title: string;
  tags: string[];
  exerciseCount: number;
  progressionNote: string | null;
}

export interface PlanDetail {
  id: string;
  title: string;
  goal: string | null;
  status: string;
  weeksCount: number;
  periodDays: number;
  notes: string | null;
  weeks: Array<{
    weekNumber: number;
    title: string | null;
    notes: string | null;
    workouts: Array<{
      id: string;
      sortOrder: number;
      progressionNote: string | null;
      workoutTemplate: { id: string; title: string; tags: string[]; exerciseCount: number };
    }>;
  }>;
  assignments: Array<{
    id: string;
    status: "active" | "paused" | "finished";
    startDate: string | null;
    currentWeekNumber: number;
    client: { id: string; displayName: string | null; email: string };
  }>;
}

export interface TemplateSummary {
  id: string;
  title: string;
  tags: string[];
  exerciseCount: number;
}

export type WeekMetaState = Record<number, { title: string; notes: string }>;
