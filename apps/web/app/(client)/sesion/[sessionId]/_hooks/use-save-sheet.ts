"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { SessionDetail } from "@regen/types";
import type { EffortMode, SheetRow } from "../_components/_types";
import { recommendedRestSeconds, restSuggestionText } from "../_lib/recommended-rest";
import { autofillNextRow, isTimedExercise, lastFilledRow, setPayloadFromRow, shouldPersistRow } from "../_lib/logger-save";

export function useSaveSheet({
  sessionId,
  currentExIdx,
  session,
  enqueue,
  load,
  effortMode,
  equipmentType,
  sheetRows,
  setSheetRows,
  setLoggerOpen,
  setRestSeconds,
  setRestTotal,
  setRestFromLogger,
  setRestSuggestion,
  setLastSaved,
  setSheetSaving,
}: {
  sessionId: string;
  currentExIdx: number;
  session: SessionDetail | null;
  enqueue: (item: { wseId: string; setNumber: number; body: Record<string, string> }) => Promise<void>;
  load: () => void;
  effortMode: EffortMode;
  equipmentType: "barra" | "mancuernas" | "maquina" | null;
  sheetRows: SheetRow[];
  setSheetRows: (v: SheetRow[] | ((prev: SheetRow[]) => SheetRow[])) => void;
  setLoggerOpen: (v: boolean) => void;
  setRestSeconds: (v: number | null) => void;
  setRestTotal: (v: number) => void;
  setRestFromLogger: (v: boolean) => void;
  setRestSuggestion: (v: string | null) => void;
  setLastSaved: (v: string | null) => void;
  setSheetSaving: (v: boolean) => void;
}) {
  const { api } = useAuth();

  return useCallback(async (opts?: { startRest?: boolean; rows?: SheetRow[] }) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    setSheetSaving(true);
    const rowsToSave = opts?.rows ?? sheetRows;
    const timed = isTimedExercise(ex);
    const forceSave = opts?.rows != null;
    try {
      for (const row of rowsToSave) {
        if (!forceSave && !shouldPersistRow(row, timed)) continue;
        const body = setPayloadFromRow(row, timed, effortMode, equipmentType);
        if (!body) continue;
        try {
          await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${row.setNumber}`, body);
          setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, isSaved: true, isDirty: false } : r));
        } catch {
          try {
            await enqueue({ wseId: ex.id, setNumber: row.setNumber, body });
            setLastSaved("guardado offline");
          } catch { /* ignore */ }
        }
      }
      setLastSaved(new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }));
      const lastFilled = lastFilledRow(rowsToSave, ex);
      if (lastFilled) setSheetRows((prev) => autofillNextRow(prev, lastFilled, effortMode, timed));
      load();
      if (opts?.startRest) {
        const rest = recommendedRestSeconds(ex, lastFilled?.effort, effortMode);
        setRestTotal(rest);
        setRestSeconds(rest);
        setRestSuggestion(restSuggestionText(ex, lastFilled?.effort, effortMode, rest));
        setRestFromLogger(true);
        setLoggerOpen(false);
      }
    } catch {
      /* ignore */
    } finally {
      setSheetSaving(false);
    }
  }, [session, currentExIdx, sheetRows, effortMode, equipmentType, enqueue, sessionId, api, load, setLastSaved, setSheetSaving, setRestTotal, setRestSeconds, setRestFromLogger, setRestSuggestion, setLoggerOpen, setSheetRows]);
}
