"use client";

import { useEffect } from "react";
import type { SessionDetail } from "@regen/types";
import type { EffortMode, SheetRow, LastRef } from "../_components/_types";

export function useLoggerEffects({
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
  restSeconds,
  setRestSeconds,
  restFromLogger,
  setRestFromLogger,
  setLoggerOpen,
  prefillExId,
  setPrefillExId,
  setEffortMode,
}: {
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
  restSeconds: number | null;
  setRestSeconds: (v: number | null | ((prev: number | null) => number | null)) => void;
  restFromLogger: boolean;
  setRestFromLogger: (v: boolean) => void;
  setLoggerOpen: (v: boolean) => void;
  prefillExId: string | null;
  setPrefillExId: (v: string | null) => void;
  setEffortMode: (v: EffortMode) => void;
}) {
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

  // Per-set timer countdown
  useEffect(() => {
    if (activeTimerRow === null || timerSecondsLeft <= 0) return;
    const id = setTimeout(() => setTimerSecondsLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [activeTimerRow, timerSecondsLeft, setTimerSecondsLeft]);

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
  }, [activeTimerRow, timerSecondsLeft, session, currentExIdx, setSheetRows, setActiveTimerRow]);

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
