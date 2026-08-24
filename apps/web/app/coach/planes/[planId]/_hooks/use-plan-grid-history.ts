"use client";

import { useCallback, useRef, useState } from "react";
import { useHistoryStack } from "@/lib/use-history-stack";
import type { CellData } from "../_components/types";

export type PlanGrid = Array<Array<CellData | null>>;

export function clonePlanGrid(grid: PlanGrid): PlanGrid {
  return grid.map((row) => row.map((c) => (c ? { ...c } : null)));
}

export function usePlanGridHistory() {
  const { push, undo, redo, clear, canUndo, canRedo } = useHistoryStack<PlanGrid>(20);
  const applyingRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(
    (grid: PlanGrid) => {
      if (applyingRef.current) return;
      push(clonePlanGrid(grid));
    },
    [push],
  );

  const beginApply = useCallback(() => {
    applyingRef.current = true;
    setBusy(true);
  }, []);

  const endApply = useCallback(() => {
    applyingRef.current = false;
    setBusy(false);
  }, []);

  return {
    capture,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    busy,
    beginApply,
    endApply,
    applyingRef,
  };
}

/** Build PUT payload items for a week row. */
export function weekItemsFromRow(row: Array<CellData | null>) {
  return row.flatMap((cell, sortOrder) =>
    cell
      ? [{ sortOrder, workoutTemplateId: cell.templateId, progressionNote: cell.progressionNote ?? null }]
      : [],
  );
}
