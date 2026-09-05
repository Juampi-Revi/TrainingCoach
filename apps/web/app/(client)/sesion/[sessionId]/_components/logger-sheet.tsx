"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { EffortMode, SheetRow, LastRef } from "./_types";
import { LoggerSheetRepsRow } from "./logger-sheet-reps-row";
import { LoggerSheetTimedRow } from "./logger-sheet-timed-row";
import { LoggerCardioTimer } from "./logger-cardio-timer";
import { LoggerHeader, LoggerFooter } from "./logger-parts";
import { SheetSnap } from "./sheet-snap";
import { LoggerQuickPresets } from "./logger-quick-presets";
import { LoggerTechniquePreview } from "./logger-technique-preview";
import { useSounds } from "../_hooks/use-sounds";
import { useExerciseIllustrationFrames } from "../_hooks/use-exercise-illustration-frames";

export function LoggerSheet({
  ex,
  sessionId,
  sheetRows,
  setSheetRows,
  effortMode,
  setEffortMode,
  equipmentType,
  setEquipmentType,
  activeTimerRow,
  setActiveTimerRow,
  timerSecondsLeft,
  setTimerSecondsLeft,
  timerEndsAtMs,
  setTimerEndsAtMs,
  lastRef,
  sheetSaving,
  saveSheet,
  deleteSet,
  onClose,
}: {
  ex: SessionExercise;
  sessionId: string;
  sheetRows: SheetRow[];
  setSheetRows: React.Dispatch<React.SetStateAction<SheetRow[]>>;
  effortMode: EffortMode;
  setEffortMode: React.Dispatch<React.SetStateAction<EffortMode>>;
  equipmentType: "barra" | "mancuernas" | "maquina" | null;
  setEquipmentType: React.Dispatch<React.SetStateAction<"barra" | "mancuernas" | "maquina" | null>>;
  activeTimerRow: number | null;
  setActiveTimerRow: React.Dispatch<React.SetStateAction<number | null>>;
  timerSecondsLeft: number;
  setTimerSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  timerEndsAtMs: number | null;
  setTimerEndsAtMs: React.Dispatch<React.SetStateAction<number | null>>;
  lastRef: LastRef | null;
  sheetSaving: boolean;
  saveSheet: (opts?: { startRest?: boolean; rows?: SheetRow[] }) => Promise<void>;
  deleteSet: (setNumber: number) => Promise<void>;
  onClose: () => void;
}) {
  const isCardioPure = !!ex.target?.durationSeconds && !ex.target?.reps && !ex.target?.sets;
  const [hiddenTechniqueUrls, setHiddenTechniqueUrls] = useState<Record<string, boolean>>({});
  const wakeLockRef = useRef<{ release?: () => Promise<void> } | null>(null);
  const lastCountdownRef = useRef<number | null>(null);
  const { playCountdown, playComplete, playStart } = useSounds();
  const { url: techniqueImageUrl, kind: techniqueKind } = useExerciseIllustrationFrames(
    { ...ex.exercise, media: ex.media },
    true,
  );

  useEffect(() => {
    if (activeTimerRow == null) {
      lastCountdownRef.current = null;
      return;
    }
    if (timerSecondsLeft > 0 && timerSecondsLeft <= 5 && lastCountdownRef.current !== timerSecondsLeft) {
      lastCountdownRef.current = timerSecondsLeft;
      playCountdown(timerSecondsLeft, 5);
    }
    if (timerSecondsLeft === 0 && lastCountdownRef.current !== 0) {
      lastCountdownRef.current = 0;
      playComplete();
    }
  }, [activeTimerRow, timerSecondsLeft, playCountdown, playComplete]);

  useEffect(() => {
    if (activeTimerRow == null) return;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<{ release?: () => Promise<void> }> };
    };
    if (!nav.wakeLock?.request) return;

    let mounted = true;
    const requestWakeLock = async () => {
      try {
        wakeLockRef.current = await nav.wakeLock!.request("screen");
      } catch {}
    };

    void requestWakeLock();
    const onVisibility = () => {
      if (!mounted || document.visibilityState !== "visible" || activeTimerRow == null) return;
      void requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibility);
      const lock = wakeLockRef.current;
      wakeLockRef.current = null;
      void lock?.release?.();
    };
  }, [activeTimerRow]);

  return (
    <SheetSnap onBackdrop={onClose}>
      {techniqueImageUrl && (
        <LoggerTechniquePreview
          url={techniqueImageUrl}
          exerciseName={ex.exercise.name}
          hidden={!!hiddenTechniqueUrls[techniqueImageUrl]}
          variant={techniqueKind === "guide" ? "guide" : "media"}
          onHide={() => {
            setHiddenTechniqueUrls((prev) => ({ ...prev, [techniqueImageUrl]: true }));
          }}
        />
      )}

      <div>
        <LoggerHeader ex={ex} lastRef={lastRef} />

        {isCardioPure ? (
          <LoggerCardioTimer
            targetSeconds={ex.target?.durationSeconds}
            onSave={async (seconds) => {
              await saveSheet({ rows: [{ setNumber: 1, duration: String(seconds), reps: "", kg: "", effort: "", isDirty: true }] });
              onClose();
            }}
            onClose={onClose}
            sheetSaving={sheetSaving}
          />
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["barra", "mancuernas", "maquina"] as const).map((eq) => {
                const sel = equipmentType === eq;
                const label = eq === "barra" ? "Barra" : eq === "mancuernas" ? "Mancuernas" : "Máquina";
                return (
                  <button
                    key={eq}
                    onClick={() => {
                      const next = sel ? null : eq;
                      setEquipmentType(next);
                      try {
                        if (next) localStorage.setItem(`regen_equip_${sessionId}_${ex.id}`, next);
                        else localStorage.removeItem(`regen_equip_${sessionId}_${ex.id}`);
                      } catch {}
                    }}
                    style={{
                      flex: 1, padding: "7px 4px", borderRadius: 9,
                      border: `1px solid ${sel ? "var(--lime)" : "var(--line-2)"}`,
                      background: sel ? "rgba(215,255,58,.1)" : "transparent",
                      color: sel ? "var(--lime)" : "var(--text-mute)",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Esfuerzo</span>
              <Tabs variant="pills" tabs={["RPE", "RIR"]} active={effortMode} onChange={(t) => setEffortMode(t as EffortMode)} />
            </div>

            <LoggerQuickPresets
              sheetRows={sheetRows}
              setSheetRows={setSheetRows}
              lastRef={lastRef}
              effortMode={effortMode}
              ex={ex}
            />

            {ex.target?.durationSeconds ? (
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, padding: "0 2px 8px", fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>
                <div>Serie</div><div style={{ textAlign: "center" }}>seg</div><div style={{ textAlign: "center" }}>kg</div><div style={{ textAlign: "center" }}>{effortMode}</div><div />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, padding: "0 2px 8px", fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>
                <div>Serie</div><div style={{ textAlign: "center" }}>kg</div><div style={{ textAlign: "center" }}>reps</div><div style={{ textAlign: "center" }}>{effortMode}</div><div />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sheetRows.map((row) => {
                const isTimingThis = activeTimerRow === row.setNumber;
                return ex.target?.durationSeconds ? (
                  <LoggerSheetTimedRow
                    key={row.setNumber}
                    ex={ex}
                    row={row}
                    isTimingThis={isTimingThis}
                    timerSecondsLeft={timerSecondsLeft}
                    setSheetRows={setSheetRows}
                    deleteSet={deleteSet}
                    onStopTimer={() => { setActiveTimerRow(null); setTimerEndsAtMs(null); setTimerSecondsLeft(0); }}
                    onStartTimer={() => {
                      const duration = ex.target?.durationSeconds ?? 0;
                      setActiveTimerRow(row.setNumber);
                      setTimerSecondsLeft(duration);
                      setTimerEndsAtMs(Date.now() + duration * 1000);
                      playStart();
                    }}
                  />
                ) : (
                  <LoggerSheetRepsRow
                    key={row.setNumber}
                    ex={ex}
                    row={row}
                    setSheetRows={setSheetRows}
                    deleteSet={deleteSet}
                  />
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              <button
                onClick={() => setSheetRows((prev) => {
                  if (prev.length <= 1) return prev;
                  const last = prev[prev.length - 1]!;
                  if (last.isSaved || last.reps || last.kg || last.effort || last.duration) return prev;
                  return prev.slice(0, -1);
                })}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                − Quitar serie
              </button>
              <button
                onClick={() => {
                  const repsPh = lastRef?.reps != null ? String(lastRef.reps) : ex.target?.reps != null ? String(ex.target.reps) : undefined;
                  const kgPh = lastRef?.weight != null ? String(lastRef.weight) : undefined;
                  const effortPh = (() => {
                    const last = effortMode === "RPE" ? lastRef?.rpe : lastRef?.rir;
                    if (last != null) return String(last);
                    if (ex.target?.intensityTarget != null) return String(ex.target.intensityTarget);
                    return undefined;
                  })();
                  const durationPh = ex.target?.durationSeconds != null ? String(ex.target.durationSeconds) : undefined;

                  setSheetRows((prev) => [
                    ...prev,
                    {
                      setNumber: prev.length + 1,
                      reps: "",
                      duration: "",
                      kg: "",
                      effort: "",
                      repsPlaceholder: repsPh,
                      durationPlaceholder: durationPh,
                      kgPlaceholder: kgPh,
                      effortPlaceholder: effortPh,
                    },
                  ]);
                }}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                + Agregar serie
              </button>
            </div>

            <LoggerFooter
              sheetSaving={sheetSaving}
              onClose={onClose}
              saveSheet={saveSheet}
              ex={ex}
              sheetRows={sheetRows}
              effortMode={effortMode}
            />
          </>
        )}
      </div>
    </SheetSnap>
  );
}
