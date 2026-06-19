"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { SessionDetail } from "@regen/types";
import type { EffortMode, SheetRow, LastRef, OfflineItem } from "../_components/_types";

export function useLoggerActions({
  sessionId,
  currentExIdx,
  session,
  queueKey,
  setOfflineCount,
  load,
  effortMode,
  setEffortMode,
  equipmentType,
  setEquipmentType,
  sheetRows,
  setSheetRows,
  setLoggerOpen,
  setRestSeconds,
  setRestTotal,
  setRestFromLogger,
  setLastSaved,
  setSheetSaving,
  lastRef,
}: {
  sessionId: string;
  currentExIdx: number;
  session: SessionDetail | null;
  queueKey: string;
  setOfflineCount: (n: number) => void;
  load: () => void;
  effortMode: EffortMode;
  setEffortMode: (v: EffortMode) => void;
  equipmentType: "barra" | "mancuernas" | "maquina" | null;
  setEquipmentType: (v: "barra" | "mancuernas" | "maquina" | null) => void;
  sheetRows: SheetRow[];
  setSheetRows: (v: SheetRow[] | ((prev: SheetRow[]) => SheetRow[])) => void;
  setLoggerOpen: (v: boolean) => void;
  setRestSeconds: (v: number | null) => void;
  setRestTotal: (v: number) => void;
  setRestFromLogger: (v: boolean) => void;
  setLastSaved: (v: string | null) => void;
  setSheetSaving: (v: boolean) => void;
  lastRef: LastRef | null;
}) {
  const { api } = useAuth();

  const openLogger = useCallback((target: SessionDetail["exercises"][number]) => {
    const savedEquip = target.sets.find((s) => s.notes === "barra" || s.notes === "mancuernas" || s.notes === "maquina");
    if (savedEquip) {
      setEquipmentType(savedEquip.notes as "barra" | "mancuernas" | "maquina");
    } else {
      const lastEquip = lastRef?.notes === "barra" || lastRef?.notes === "mancuernas" || lastRef?.notes === "maquina"
        ? lastRef.notes
        : null;
      if (lastEquip) {
        setEquipmentType(lastEquip as "barra" | "mancuernas" | "maquina");
      } else {
        try {
          const eq = localStorage.getItem(`regen_equip_${sessionId}_${target.id}`);
          setEquipmentType(eq === "barra" || eq === "mancuernas" || eq === "maquina" ? eq : null);
        } catch { setEquipmentType(null); }
      }
    }
    setSheetRows([]);
    setLoggerOpen(true);
  }, [sessionId, lastRef, setEquipmentType, setSheetRows, setLoggerOpen]);

  const deleteSet = useCallback(async (setNumber: number) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    const row = sheetRows.find((r) => r.setNumber === setNumber);
    if (!row) return;
    if (row.isSaved) {
      try {
        await api.del(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${setNumber}`);
      } catch (e) { console.error(e); }
    }
    setSheetRows((prev) => prev.filter((r) => r.setNumber !== setNumber));
    load();
  }, [session, currentExIdx, sheetRows, api, sessionId, load, setSheetRows]);

  const saveSheet = useCallback(async (opts?: { startRest?: boolean; rows?: SheetRow[] }) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    setSheetSaving(true);
    const rowsToSave = opts?.rows ?? sheetRows;
    try {
      for (const row of rowsToSave) {
        const body: Record<string, string> = {};
        if (row.kg) body.weight = row.kg;
        const isTimed = !!(ex.target?.durationSeconds);
        if (isTimed) {
          if (row.duration) body.durationSeconds = row.duration;
        } else {
          if (row.reps) body.reps = row.reps;
        }
        if (row.effort) {
          if (effortMode === "RPE") body.rpe = row.effort;
          else body.rir = row.effort;
        }
        if (equipmentType) body.notes = equipmentType;
        const hasAny = isTimed ? !!(row.duration || row.kg || row.effort) : !!(row.reps || row.kg || row.effort);
        if (!hasAny) continue;
        try {
          await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${row.setNumber}`, body);
          setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, isSaved: true } : r));
        } catch {
          try {
            const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
            queue.push({ wseId: ex.id, setNumber: row.setNumber, body });
            localStorage.setItem(queueKey, JSON.stringify(queue));
            setOfflineCount(queue.length);
            setLastSaved("guardado offline");
          } catch {}
        }
      }
      setLastSaved(new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }));
      load();
      if (opts?.startRest) {
        const rest = ex.target?.restSeconds ?? 90;
        setRestTotal(rest);
        setRestSeconds(rest);
        setRestFromLogger(true);
        setLoggerOpen(false);
      }
    } catch {
      // no-op
    } finally {
      setSheetSaving(false);
    }
  }, [session, currentExIdx, sheetRows, effortMode, equipmentType, queueKey, sessionId, api, setOfflineCount, load, setLastSaved, setSheetSaving, setRestTotal, setRestSeconds, setRestFromLogger, setLoggerOpen, setSheetRows]);

  return { openLogger, deleteSet, saveSheet };
}
