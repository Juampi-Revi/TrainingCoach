import type { SessionExercise } from "@regen/types";
import type { EffortMode } from "../_components/_types";

export function recommendedRestSeconds(
  ex: SessionExercise,
  lastEffort: string | undefined,
  effortMode: EffortMode,
): number {
  const coachRest = ex.target?.restSeconds;
  if (coachRest != null && coachRest > 0) return coachRest;

  if (ex.block.type === "warmup") return 30;
  if (ex.block.type === "cardio" || ex.block.type === "cooldown") return 45;

  const raw = lastEffort != null ? Number(lastEffort) : NaN;
  if (Number.isFinite(raw)) {
    const rpe = effortMode === "RPE" ? raw : Math.max(1, 10 - raw);
    if (rpe >= 9) return 180;
    if (rpe >= 8) return 150;
    if (rpe >= 7) return 120;
    if (rpe <= 5) return 60;
  }

  return 90;
}

export function restSuggestionText(
  ex: SessionExercise,
  lastEffort: string | undefined,
  effortMode: EffortMode,
  restSec: number,
): string | null {
  const parts: string[] = [];
  const raw = lastEffort != null ? Number(lastEffort) : NaN;
  if (Number.isFinite(raw)) {
    const label = effortMode === "RPE" ? `RPE ${raw}` : `RIR ${raw}`;
    parts.push(`Último set en ${label} → descanso ~${formatRest(restSec)}`);
  } else if (ex.target?.restSeconds) {
    parts.push(`Descanso del coach: ${formatRest(restSec)}`);
  }

  const nextHint = [
    ex.target?.sets && ex.target?.reps ? `${ex.target.sets}×${ex.target.reps}` : null,
    ex.target?.intensityType && ex.target?.intensityTarget
      ? `${ex.target.intensityType.toUpperCase()} ${ex.target.intensityTarget}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (nextHint) parts.push(`Objetivo: ${nextHint}`);
  return parts.length ? parts.join(" · ") : null;
}

function formatRest(sec: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
  return `${sec}s`;
}

/** Suggest ±5% weight from last effort (RPE). */
export function suggestWeightKg(baseKg: string, effort: string, effortMode: EffortMode): string | null {
  const kg = Number(baseKg);
  const raw = Number(effort);
  if (!Number.isFinite(kg) || kg <= 0 || !Number.isFinite(raw)) return null;
  const rpe = effortMode === "RPE" ? raw : Math.max(1, 10 - raw);
  if (rpe >= 9) return trimKg(kg * 0.95);
  if (rpe <= 6) return trimKg(kg * 1.05);
  return null;
}

function trimKg(n: number): string {
  const rounded = Math.round(n * 2) / 2;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function weightSuggestionLabel(effort: string | undefined, effortMode: EffortMode): string | null {
  const raw = Number(effort);
  if (!Number.isFinite(raw)) return null;
  const rpe = effortMode === "RPE" ? raw : Math.max(1, 10 - raw);
  if (rpe >= 9) return "Sugerido −5%";
  if (rpe <= 6) return "Sugerido +5%";
  return null;
}
