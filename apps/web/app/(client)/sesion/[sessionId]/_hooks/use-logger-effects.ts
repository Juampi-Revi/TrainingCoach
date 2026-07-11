"use client";

import { useEffect } from "react";
import type { SessionDetail } from "@regen/types";
import type { EffortMode, SheetRow, LastRef } from "../_components/_types";

export function useLoggerEffects({
  sessionId,
  session,
  currentExIdx,
  loggerOpen,
  sheetRows,
  setSheetRows,
  effortMode,
  lastRef,
  lastRefMap,
  setLastRefMap,
  api,
  activeTimerRow,
  setActiveTimerRow,
  timerSecondsLeft,
  setTimerSecondsLeft,
  timerEndsAtMs,
  setTimerEndsAtMs,
  restSeconds,
  setRestSeconds,
  restFromLogger,
  setRestFromLogger,
  setLoggerOpen,
  prefillExId,
  setPrefillExId,
  setEffortMode,
}: {
  sessionId: string;
  session: SessionDetail | null;
  currentExIdx: number;
  loggerOpen: boolean;
  sheetRows: SheetRow[];
  setSheetRows: (v: SheetRow[] | ((prev: SheetRow[]) => SheetRow[])) => void;
  effortMode: EffortMode;
  lastRef: LastRef | null;
  lastRefMap: Record<string, LastRef>;
  setLastRefMap: (v: Record<string, LastRef> | ((prev: Record<string, LastRef>) => Record<string, LastRef>)) => void;
  api: { get: <T>(url: string) => Promise<T | null> };
  activeTimerRow: number | null;
  setActiveTimerRow: (v: number | null) => void;
  timerSecondsLeft: number;
  setTimerSecondsLeft: (v: number | ((prev: number) => number)) => void;
  timerEndsAtMs: number | null;
  setTimerEndsAtMs: (v: number | null) => void;
  restSeconds: number | null;
  setRestSeconds: (v: number | null | ((prev: number | null) => number | null)) => void;
  restFromLogger: boolean;
  setRestFromLogger: (v: boolean) => void;
  setLoggerOpen: (v: boolean) => void;
  prefillExId: string | null;
  setPrefillExId: (v: string | null) => void;
  setEffortMode: (v: EffortMode) => void;
}) {
  const currentExercise = session?.exercises[currentExIdx] ?? null;
  const timerStorageKey = currentExercise ? `regen_set_timer_${sessionId}_${currentExercise.id}` : null;

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
  }, [session, currentExIdx, prefillExId, setPrefillExId, setEffortMode]);

  // Initialize sheet rows when logger opens
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
        if (s?.weight != null || s?.reps != null) {
          const effort = effortMode === "RPE" ? s?.rpe : s?.rir;
          return {
            setNumber,
            reps: s?.reps != null ? String(s.reps) : "",
            duration: s?.durationSeconds != null ? String(s.durationSeconds) : "",
            kg: s?.weight != null ? String(s.weight) : "",
            effort: effort != null ? String(effort) : "",
            isSaved: true,
          };
        }
        const effort = effortMode === "RPE" ? lastRef?.rpe : lastRef?.rir;
        const repsPh = target.target?.reps != null ? String(target.target.reps) : "";
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
          isSaved: false,
        };
      }));
    }, 0);
    return () => clearTimeout(id);
  }, [loggerOpen, session, currentExIdx, effortMode, lastRef, sheetRows.length, setSheetRows]);

  // Restore an active per-set timer when returning from background / lock screen.
  useEffect(() => {
    if (!loggerOpen || currentExercise == null || activeTimerRow !== null || timerStorageKey == null) return;
    try {
      const raw = localStorage.getItem(timerStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { row: number; endsAtMs: number };
      if (typeof parsed.row !== "number" || typeof parsed.endsAtMs !== "number") return;
      if (parsed.endsAtMs <= Date.now()) {
        localStorage.removeItem(timerStorageKey);
        return;
      }
      setActiveTimerRow(parsed.row);
      setTimerEndsAtMs(parsed.endsAtMs);
      setTimerSecondsLeft(Math.max(0, Math.ceil((parsed.endsAtMs - Date.now()) / 1000)));
    } catch {}
  }, [loggerOpen, currentExercise, activeTimerRow, timerStorageKey, setActiveTimerRow, setTimerEndsAtMs, setTimerSecondsLeft]);

  // Per-set timer countdown based on a deadline timestamp, so it stays accurate across background / lock.
  useEffect(() => {
    if (activeTimerRow === null || timerEndsAtMs == null) return;

    const sync = () => {
      const next = Math.max(0, Math.ceil((timerEndsAtMs - Date.now()) / 1000));
      setTimerSecondsLeft(next);
    };

    sync();
    const id = setInterval(sync, 250);
    return () => clearInterval(id);
  }, [activeTimerRow, timerEndsAtMs, setTimerSecondsLeft]);

  useEffect(() => {
    if (timerStorageKey == null) return;
    try {
      if (activeTimerRow != null && timerEndsAtMs != null && timerSecondsLeft > 0) {
        localStorage.setItem(timerStorageKey, JSON.stringify({ row: activeTimerRow, endsAtMs: timerEndsAtMs }));
      } else {
        localStorage.removeItem(timerStorageKey);
      }
    } catch {}
  }, [activeTimerRow, timerEndsAtMs, timerSecondsLeft, timerStorageKey]);

  useEffect(() => {
    if (activeTimerRow === null || timerSecondsLeft > 0) return;
    const targetSec = currentExercise?.target?.durationSeconds ?? 30;
    const t = setTimeout(() => {
      setSheetRows((prev) =>
        prev.map((r) => r.setNumber === activeTimerRow ? { ...r, duration: String(targetSec) } : r),
      );
      setActiveTimerRow(null);
      setTimerEndsAtMs(null);
    }, 0);
    return () => clearTimeout(t);
  }, [activeTimerRow, timerSecondsLeft, currentExercise, setSheetRows, setActiveTimerRow, setTimerEndsAtMs]);

  // Fetch last set reference when logger opens
  useEffect(() => {
    if (!loggerOpen || !session) return;
    const target = session.exercises[currentExIdx];
    if (!target || target.block.type === "warmup") return;
    const exId = target.exercise.id;
    if (lastRefMap[exId]) return;
    api.get<LastRef | null>(`/client/exercises/${exId}/last-set`)
      .then((r) => {
        if (r) {
          setLastRefMap((prev) => ({ ...prev, [exId]: r }));
        }
      }).catch(() => {});
  }, [loggerOpen, session, currentExIdx, api, lastRefMap, setLastRefMap]);

  // Rest countdown
  useEffect(() => {
    if (restSeconds == null || restSeconds <= 0) return;
    const id = setTimeout(() => setRestSeconds((s) => (s == null || s <= 1 ? null : s - 1)), 1000);
    return () => clearTimeout(id);
  }, [restSeconds, setRestSeconds]);

  // Re-open logger when rest ends
  useEffect(() => {
    if (restSeconds !== null || !restFromLogger) return;
    const t = setTimeout(() => {
      setRestFromLogger(false);
      setLoggerOpen(true);
    }, 0);
    return () => clearTimeout(t);
  }, [restSeconds, restFromLogger, setRestFromLogger, setLoggerOpen]);
}
