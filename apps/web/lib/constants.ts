import type { BlockType } from "@regen/types";

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

export function blockTypeLabel(type: BlockType): string {
  switch (type) {
    case "tabata": return "TABATA";
    case "hiit":   return "HIIT";
    case "emom":   return "EMOM";
    case "amrap":  return "AMRAP";
  }
}

export function blockSummary(b: {
  type: BlockType;
  workSeconds: number | null;
  restSeconds: number | null;
  rounds: number | null;
  totalDurationSeconds: number | null;
}): string {
  if (b.type === "tabata" || b.type === "hiit") {
    const w      = b.workSeconds ?? 20;
    const r      = b.restSeconds ?? 10;
    const rounds = b.rounds ?? 8;
    return `${w}/${r}s · ${rounds} rondas`;
  }
  if (b.type === "emom") {
    const total = b.totalDurationSeconds ?? (b.rounds ? b.rounds * 60 : null);
    if (total) return `${Math.round(total / 60)} min`;
    return "—";
  }
  const total = b.totalDurationSeconds ?? null;
  if (total) return `${Math.round(total / 60)} min`;
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
