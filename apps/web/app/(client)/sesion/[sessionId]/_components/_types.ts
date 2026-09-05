export type EffortMode = "RPE" | "RIR";

export interface OfflineItem {
  wseId: string;
  setNumber: number;
  body: Record<string, string>;
}

export interface SheetRow {
  setNumber: number;
  reps: string;
  duration: string;
  kg: string;
  effort: string;
  repsPlaceholder?: string;
  durationPlaceholder?: string;
  kgPlaceholder?: string;
  effortPlaceholder?: string;
  isSaved?: boolean;
  suggestionLabel?: string | null;
}

export interface LastRef {
  weight: string | null;
  reps: number | null;
  rpe: string | null;
  rir: string | null;
  notes: string | null;
}
