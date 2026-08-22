import type { BlockType, IntervalType, WorkoutBlockStepSummary, WorkoutBlockSummary } from "@regen/types";

// ─── Muscle labels ─────────────────────────────────────────────────────────────

export const MUSCLE_LABEL: Record<string, string> = {
  chest:      "Pecho",
  back:       "Espalda",
  shoulders:  "Hombros",
  biceps:     "Bíceps",
  triceps:    "Tríceps",
  legs:       "Piernas",
  glutes:     "Glúteos",
  core:       "Core",
  calves:     "Pantorrillas",
  forearms:   "Antebrazos",
  full_body:  "Cuerpo completo",
};

export const EXERCISE_DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export const EXERCISE_OBJECTIVE_LABEL: Record<string, string> = {
  strength: "Fuerza",
  hypertrophy: "Hipertrofia",
  conditioning: "Acondicionamiento",
  mobility: "Movilidad",
  skill: "Técnica / Skill",
};

// ─── Superset group colors ──────────────────────────────────────────────────────

export const GROUP_COLORS: Record<string, string> = {
  A: "var(--lime)",
  B: "var(--info)",
  C: "var(--warn)",
  D: "#FF8B8B",
  E: "#C084FC",
  F: "var(--success)",
};

export const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Avatar palette for coach lists (cycles by index). */
export const AVATAR_TONES = [
  "var(--danger)",
  "var(--warn)",
  "var(--info)",
  "var(--lime)",
  "var(--success)",
] as const;

export function groupLabel(size: number): string {
  if (size === 2) return "Biserie";
  if (size === 3) return "Triserie";
  return "Circuito";
}

// ─── Block type helpers ─────────────────────────────────────────────────────────

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  warmup:   "Calentamiento",
  strength: "Fuerza",
  intervals: "Intervalos",
  cardio:   "Cardio",
  cooldown: "Enfriamiento",
};

export const INTERVAL_TYPE_LABELS: Record<IntervalType, string> = {
  tabata: "TABATA",
  hiit:   "HIIT",
  emom:   "EMOM",
  amrap:  "AMRAP",
};

export function blockTypeLabel(type: BlockType, intervalType?: IntervalType | null): string {
  if (type === "intervals" && intervalType) {
    return INTERVAL_TYPE_LABELS[intervalType];
  }
  return BLOCK_TYPE_LABELS[type];
}

export function blockSummary(b: WorkoutBlockSummary): string {
  if (b.steps?.length) {
    return `${b.steps.length} paso${b.steps.length === 1 ? "" : "s"}${b.targetZone ? ` · ${b.targetZone}` : ""}`;
  }
  // Interval blocks
  if (b.type === "intervals" && b.intervalType) {
    if (b.intervalType === "tabata" || b.intervalType === "hiit") {
      const w = b.workSeconds ?? 20;
      const r = b.restSeconds ?? 10;
      const rounds = b.rounds ?? 8;
      const totalMin = Math.round((w + r) * rounds / 60);
      return `${w}/${r}s · ${rounds} rnd · ${totalMin}min`;
    }
    if (b.intervalType === "emom") {
      const rounds = b.rounds ?? 0;
      if (rounds > 0) return `${rounds} min (1min/rnd)`;
      return "—";
    }
    if (b.intervalType === "amrap") {
      const total = b.totalDurationSeconds ?? null;
      if (total) return `${Math.round(total / 60)} min AMRAP`;
      return "—";
    }
  }

  // Cardio blocks
  if (b.type === "cardio" && b.targetMinutes) {
    return `${b.targetMinutes} min${b.targetZone ? ` · ${b.targetZone}` : ""}`;
  }

  // Strength/Warmup/Cooldown blocks - show duration if configured
  if ((b.type === "strength" || b.type === "warmup" || b.type === "cooldown") && b.targetMinutes) {
    return `${b.targetMinutes} min`;
  }

  return "—";
}

export function formatStepTarget(step: WorkoutBlockStepSummary): string {
  if (step.targetLabel) return step.targetLabel;
  if (!step.targetType || step.targetType === "free") return "Libre";
  const min = step.targetValueLow;
  const max = step.targetValueHigh;
  const unit = step.targetUnit ? ` ${step.targetUnit}` : "";
  if (min && max) return `${min}-${max}${unit}`;
  if (min) return `${min}${unit}`;
  if (max) return `${max}${unit}`;
  return step.targetType.replace("_", " ").toUpperCase();
}

export function formatStepLength(step: WorkoutBlockStepSummary): string {
  const parts: string[] = [];
  if (step.distanceMeters) parts.push(`${step.distanceMeters}m`);
  if (step.durationSeconds) parts.push(`${step.durationSeconds}s`);
  return parts.join(" · ") || "Sin duración";
}

export function summarizeEnduranceSteps(steps: WorkoutBlockStepSummary[] | null | undefined) {
  return (steps ?? []).reduce(
    (acc, step) => {
      acc.steps += 1;
      acc.totalDistanceMeters += step.distanceMeters ?? 0;
      acc.totalDurationSeconds += step.durationSeconds ?? 0;
      if (step.kind === "work") acc.workSteps += 1;
      return acc;
    },
    { steps: 0, workSteps: 0, totalDistanceMeters: 0, totalDurationSeconds: 0 },
  );
}

export function formatSecondsShort(seconds: number): string {
  if (seconds <= 0) return "0 min";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Block colors ───────────────────────────────────────────────────────────────

export const BLOCK_COLORS: Record<BlockType, string> = {
  warmup:   "var(--warn)",    // Orange
  strength: "var(--lime)",    // Lime green
  intervals: "#FF8E72",       // Coral
  cardio:   "#7AB8FF",        // Blue
  cooldown: "#A78BFA",        // Purple
};

// ─── Block icons (using text for now, could use Icon names) ─────────────────────

export const BLOCK_ICONS: Record<BlockType, string> = {
  warmup:   "timer",
  strength: "dumbbell",
  intervals: "flame",
  cardio:   "heart",
  cooldown: "star",
};
