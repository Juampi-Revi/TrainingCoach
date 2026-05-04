import type { BlockType, IntervalType, WorkoutBlockSummary } from "@regen/types";

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

// ─── Superset group colors ──────────────────────────────────────────────────────

export const GROUP_COLORS: Record<string, string> = {
  A: "var(--lime)",
  B: "#7AB8FF",
  C: "#FFB547",
  D: "#FF8B8B",
  E: "#C084FC",
  F: "#6EE7B7",
};

export const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F"];

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
  // Interval blocks
  if (b.type === "intervals" && b.intervalType) {
    if (b.intervalType === "tabata" || b.intervalType === "hiit") {
      const w = b.workSeconds ?? 20;
      const r = b.restSeconds ?? 10;
      const rounds = b.rounds ?? 8;
      return `${w}/${r}s · ${rounds} rondas`;
    }
    if (b.intervalType === "emom") {
      const total = b.totalDurationSeconds ?? (b.rounds ? b.rounds * 60 : null);
      if (total) return `${Math.round(total / 60)} min`;
      return "—";
    }
    if (b.intervalType === "amrap") {
      const total = b.totalDurationSeconds ?? null;
      if (total) return `${Math.round(total / 60)} min`;
      return "—";
    }
  }

  // Cardio blocks
  if (b.type === "cardio" && b.targetMinutes) {
    return `${b.targetMinutes} min${b.targetZone ? ` · ${b.targetZone}` : ""}`;
  }

  // Strength blocks - show exercise count
  if (b.type === "strength" && b.exerciseCount > 0) {
    return `${b.exerciseCount} ejercicio${b.exerciseCount !== 1 ? "s" : ""}`;
  }

  // Warmup/Cooldown
  if ((b.type === "warmup" || b.type === "cooldown") && b.exerciseCount > 0) {
    return `${b.exerciseCount} ejercicio${b.exerciseCount !== 1 ? "s" : ""}`;
  }

  return "—";
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
