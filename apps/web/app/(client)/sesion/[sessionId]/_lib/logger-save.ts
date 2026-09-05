import type { SessionExercise } from "@regen/types";
import type { EffortMode, SheetRow } from "../_components/_types";
import { suggestWeightKg, weightSuggestionLabel } from "./recommended-rest";

export function rowHasData(row: SheetRow, timed: boolean): boolean {
  return timed ? !!(row.duration || row.kg || row.effort) : !!(row.reps || row.kg || row.effort);
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

export function autofillNextRow(prev: SheetRow[], lastFilled: SheetRow, effortMode: EffortMode): SheetRow[] {
  const nextEmpty = prev.find((r) => !r.isSaved && !r.reps && !r.kg && !r.effort && !r.duration);
  if (!nextEmpty) return prev;
  const suggestedKg = lastFilled.kg
    ? suggestWeightKg(lastFilled.kg, lastFilled.effort, effortMode)
    : null;
  const label = weightSuggestionLabel(lastFilled.effort, effortMode);
  return prev.map((r) =>
    r.setNumber === nextEmpty.setNumber
      ? {
          ...r,
          kg: suggestedKg ?? lastFilled.kg,
          reps: lastFilled.reps,
          duration: lastFilled.duration,
          effort: lastFilled.effort,
          suggestionLabel: suggestedKg ? label : (lastFilled.kg ? "Igual que el set anterior" : null),
        }
      : r,
  );
}

export function lastFilledRow(rows: SheetRow[], ex: SessionExercise): SheetRow | undefined {
  const timed = !!(ex.target?.durationSeconds);
  return [...rows].reverse().find((r) => rowHasData(r, timed));
}
