"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { SessionDetail, SessionExercise } from "@regen/types";
import type { EffortMode, SheetRow, LastRef, OfflineItem } from "../_components/_types";

export function useSetLogger({
  sessionId,
  currentExIdx,
  session,
  queueKey,
  setOfflineCount,
  load,
}: {
  sessionId: string;
  currentExIdx: number;
  session: SessionDetail | null;
  queueKey: string;
  setOfflineCount: (n: number) => void;
  load: () => void;
}) {
  const { api } = useAuth();

  const [effortMode, setEffortMode] = useState<EffortMode>("RPE");
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [equipmentType, setEquipmentType] = useState<"barra" | "mancuernas" | "maquina" | null>(null);
  const [activeTimerRow, setActiveTimerRow] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(90);
  const [restFromLogger, setRestFromLogger] = useState(false);
  const [lastRef, setLastRef] = useState<LastRef | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [prefillExId, setPrefillExId] = useState<string | null>(null);

  // Pre-fill effort mode from exercise target
  useEffect(() => {
    if (!session) return;
    const ex = session.exercises[currentExIdx];
    if (!ex || prefillExId === ex.id) return;
    const intensityType = ex.target?.intensityType?.toUpperCase();
    const id = setTimeout(() => {
      setPrefillExId(ex.id);
      setEffortMode(intensityType === "RIR" ? "RIR" : "RPE");
    }, 0);
    return () => clearTimeout(id);
  }, [session, currentExIdx, prefillExId]);

  // Initialize sheet rows when logger opens - with prefill from lastRef
  useEffect(() => {
    if (!loggerOpen || !session) return;
    const target = session.exercises[currentExIdx];
    if (!target || target.block.type === "warmup") return;
    if (sheetRows.length > 0) return;
    const id = setTimeout(() => {
      const existing = target.sets ?? [];
      const baseCount = Math.max(existing.length, target.target?.sets ?? 0, 1);
      setSheetRows(Array.from({ length: baseCount }).map((_, idx) => {
        const setNumber = idx + 1;
        const s = existing.find((x) => x.setNumber === setNumber);
        
        // If already has data in current session, use it
        if (s?.weight != null || s?.reps != null) {
          const effort = effortMode === "RPE" ? s?.rpe : s?.rir;
          return {
            setNumber,
            reps: s?.reps != null ? String(s.reps) : "",
            duration: s?.durationSeconds != null ? String(s.durationSeconds) : "",
            kg: s?.weight != null ? String(s.weight) : "",
            effort: effort != null ? String(effort) : "",
            existingId: s?.id,
          };
        }
        
        const effort = effortMode === "RPE" ? lastRef?.rpe : lastRef?.rir;
        const repsPh =
          lastRef?.reps != null
            ? String(lastRef.reps)
            : target.target?.reps != null
              ? String(target.target.reps)
              : "";
        const kgPh = lastRef?.weight != null ? String(lastRef.weight) : "";
        const effortPh = effort != null ? String(effort) : target.target?.intensityTarget != null ? String(target.target.intensityTarget) : "";
        const durationPh = target.target?.durationSeconds != null ? String(target.target.durationSeconds) : "";

        return {
          setNumber,
          reps: "",
          duration: "",
          kg: "",
          effort: "",
          repsPlaceholder: repsPh || undefined,
          durationPlaceholder: durationPh || undefined,
          kgPlaceholder: kgPh || undefined,
          effortPlaceholder: effortPh || undefined,
          existingId: undefined,
        };
      }));
    }, 0);
    return () => clearTimeout(id);
  }, [loggerOpen, session, currentExIdx, effortMode, lastRef, sheetRows.length]);

  // Per-set timer countdown
  useEffect(() => {
    if (activeTimerRow === null || timerSecondsLeft <= 0) return;
    const id = setTimeout(() => setTimerSecondsLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [activeTimerRow, timerSecondsLeft]);

  useEffect(() => {
    if (activeTimerRow === null || timerSecondsLeft > 0) return;
    const targetSec = session?.exercises[currentExIdx]?.target?.durationSeconds ?? 30;
    const t = setTimeout(() => {
      setSheetRows((prev) =>
        prev.map((r) => r.setNumber === activeTimerRow ? { ...r, duration: String(targetSec) } : r),
      );
      setActiveTimerRow(null);
    }, 0);
    return () => clearTimeout(t);
  }, [activeTimerRow, timerSecondsLeft, session, currentExIdx]);

  // Fetch last set reference when logger opens
  useEffect(() => {
    if (!loggerOpen || !session) return;
    const target = session.exercises[currentExIdx];
    if (!target || target.block.type === "warmup") return;
    const t = setTimeout(() => {
      setLastRef(null);
    }, 0);
    api.get<LastRef | null>(`/client/exercises/${target.exercise.id}/last-set`)
      .then((r) => setLastRef(r)).catch(() => {});
    return () => clearTimeout(t);
  }, [loggerOpen, session, currentExIdx, api]);

  // Rest countdown
  useEffect(() => {
    if (restSeconds == null || restSeconds <= 0) return;
    const id = setTimeout(() => setRestSeconds((s) => (s == null || s <= 1 ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [restSeconds]);

  // Re-open logger when rest ends
  useEffect(() => {
    if (restSeconds !== null || !restFromLogger) return;
    const t = setTimeout(() => {
      setRestFromLogger(false);
      setLoggerOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, [restSeconds, restFromLogger]);

  const openLogger = useCallback((target: SessionExercise) => {
    // Pre-fill equipment type from saved sets, localStorage, or lastRef
    const savedEquip = target.sets.find((s) => s.notes === "barra" || s.notes === "mancuernas" || s.notes === "maquina");
    if (savedEquip) {
      setEquipmentType(savedEquip.notes as "barra" | "mancuernas" | "maquina");
    } else {
      // Try to get from lastRef first, then from localStorage
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
  }, [sessionId, lastRef]);

  const deleteSet = useCallback(async (setNumber: number) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    try {
      await api.del(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${setNumber}`);
      load();
    } catch (e) { console.error(e); }
  }, [session, currentExIdx, api, sessionId, load]);

  const saveSheet = useCallback(async (opts?: { startRest?: boolean }) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    setSheetSaving(true);
    const isTimed = !!(ex.target?.durationSeconds);
    try {
      for (const row of sheetRows) {
        const body: Record<string, string> = {};
        if (row.kg) body.weight = row.kg;
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
    } finally {
      setSheetSaving(false);
    }
  }, [session, currentExIdx, sheetRows, effortMode, equipmentType, queueKey, sessionId, api, setOfflineCount, load]);

  const saveRow = useCallback(async (setNumber: number, opts?: { startRest?: boolean }) => {
    const ex = session?.exercises[currentExIdx];
    if (!ex) return;
    const row = sheetRows.find((r) => r.setNumber === setNumber);
    if (!row) return;

    setSheetSaving(true);
    const isTimed = !!(ex.target?.durationSeconds);
    try {
      const body: Record<string, string> = {};
      if (row.kg) body.weight = row.kg;
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
      if (!hasAny) return;

      try {
        await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${row.setNumber}`, body);
        setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, existingId: r.existingId ?? "saved" } : r));
      } catch {
        try {
          const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
          queue.push({ wseId: ex.id, setNumber: row.setNumber, body });
          localStorage.setItem(queueKey, JSON.stringify(queue));
          setOfflineCount(queue.length);
          setLastSaved("guardado offline");
        } catch {}
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
    } finally {
      setSheetSaving(false);
    }
  }, [session, currentExIdx, sheetRows, effortMode, equipmentType, queueKey, sessionId, api, setOfflineCount, load]);

  return {
    effortMode, setEffortMode,
    loggerOpen, setLoggerOpen,
    sheetRows, setSheetRows,
    sheetSaving,
    equipmentType, setEquipmentType,
    activeTimerRow, setActiveTimerRow,
    timerSecondsLeft, setTimerSecondsLeft,
    restSeconds, setRestSeconds,
    restTotal,
    lastRef,
    lastSaved,
    openLogger,
    saveSheet,
    saveRow,
    deleteSet,
  };
}
