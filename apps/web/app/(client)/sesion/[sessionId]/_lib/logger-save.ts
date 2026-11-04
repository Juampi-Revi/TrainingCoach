import type { SessionExercise } from "@regen/types";
import type { EffortMode, SheetRow } from "../_components/_types";
import { suggestWeightKg, weightSuggestionLabel } from "./recommended-rest";

export function isTimedExercise(ex: SessionExercise): boolean {
  return !!(ex.target?.durationSeconds);
}

export function rowHasData(row: SheetRow, timed: boolean): boolean {
  if (timed) return !!(row.duration || row.kg || row.effort);
  return !!(row.reps || row.kg || row.effort);
}

/** Only persist rows the user actually edited (or an explicit forced save). */
export function shouldPersistRow(row: SheetRow, timed: boolean, force = false): boolean {
  if (!rowHasData(row, timed)) return false;
  if (force) return true;
  if (row.isSaved && !row.isDirty) return false;
  return !!row.isDirty;
}

export function setPayloadFromRow(
  row: SheetRow,
  timed: boolean,
  effortMode: EffortMode,
  equipmentType: "barra" | "mancuernas" | "maquina" | null,
): Record<string, string> | null {
  const body: Record<string, string> = {};
  if (row.kg) body.weight = row.kg;
  if (timed) {
    if (row.duration) body.durationSeconds = row.duration;
  } else if (row.reps) {
    body.reps = row.reps;
  }
  if (row.effort) {
    if (effortMode === "RPE") body.rpe = row.effort;
    else body.rir = row.effort;
  }
  if (equipmentType) body.notes = equipmentType;
  if (!rowHasData(row, timed)) return null;
  return body;
}

export function autofillNextRow(
  prev: SheetRow[],
  lastFilled: SheetRow,
  effortMode: EffortMode,
  timed: boolean,
): SheetRow[] {
  const nextEmpty = prev.find((r) => !r.isSaved && !rowHasData(r, timed));
  if (!nextEmpty) return prev;

  const suggestedKg = lastFilled.kg
    ? suggestWeightKg(lastFilled.kg, lastFilled.effort, effortMode)
    : null;
  const label = weightSuggestionLabel(lastFilled.effort, effortMode);

  return prev.map((r) =>
    r.setNumber === nextEmpty.setNumber
      ? {
          ...r,
          kgPlaceholder: (suggestedKg ?? lastFilled.kg) || r.kgPlaceholder,
          repsPlaceholder: timed ? r.repsPlaceholder : (lastFilled.reps || r.repsPlaceholder),
          durationPlaceholder: timed ? (lastFilled.duration || r.durationPlaceholder) : r.durationPlaceholder,
          effortPlaceholder: lastFilled.effort || r.effortPlaceholder,
          suggestionLabel: suggestedKg ? label : (lastFilled.kg ? "Igual que el set anterior" : null),
        }
      : r,
  );
}

export function lastFilledRow(rows: SheetRow[], ex: SessionExercise): SheetRow | undefined {
  const timed = isTimedExercise(ex);
  return [...rows].reverse().find((r) => rowHasData(r, timed));
}

export function buildSheetRows(
  ex: SessionExercise,
  effortMode: EffortMode,
  lastRef: { weight: string | null; reps: number | null; rpe: string | null; rir: string | null } | null,
): SheetRow[] {
  const existing = ex.sets ?? [];
  const baseCount = Math.max(existing.length, ex.target?.sets ?? 0, 1);
  return Array.from({ length: baseCount }, (_, idx) => {
    const setNumber = idx + 1;
    const saved = existing.find((set) => set.setNumber === setNumber);
    if (saved?.weight != null || saved?.reps != null || saved?.durationSeconds != null) {
      const effort = effortMode === "RPE" ? saved?.rpe : saved?.rir;
      return {
        setNumber,
        reps: saved?.reps != null ? String(saved.reps) : "",
        duration: saved?.durationSeconds != null ? String(saved.durationSeconds) : "",
        kg: saved?.weight != null ? String(saved.weight) : "",
        effort: effort != null ? String(effort) : "",
        isSaved: true,
        isDirty: false,
      };
    }
    const effort = effortMode === "RPE" ? lastRef?.rpe : lastRef?.rir;
    return {
      setNumber,
      reps: "",
      duration: "",
      kg: "",
      effort: "",
      repsPlaceholder: ex.target?.reps != null ? String(ex.target.reps) : undefined,
      durationPlaceholder: ex.target?.durationSeconds != null ? String(ex.target.durationSeconds) : undefined,
      kgPlaceholder: lastRef?.weight != null ? String(lastRef.weight) : undefined,
      effortPlaceholder: effort != null
        ? String(effort)
        : ex.target?.intensityTarget != null
          ? String(ex.target.intensityTarget)
          : undefined,
      isSaved: false,
    };
  });
}

export function sheetCanRefill(rows: SheetRow[]): boolean {
  return rows.length === 0 || rows.every((row) => !row.isDirty && !row.isSaved);
}

export function markRowDirty(row: SheetRow, patch: Partial<SheetRow>): SheetRow {
  return { ...row, ...patch, isDirty: true, suggestionLabel: patch.suggestionLabel ?? null };
}
