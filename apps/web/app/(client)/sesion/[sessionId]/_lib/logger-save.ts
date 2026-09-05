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

export function markRowDirty(row: SheetRow, patch: Partial<SheetRow>): SheetRow {
  return { ...row, ...patch, isDirty: true, suggestionLabel: patch.suggestionLabel ?? null };
}
