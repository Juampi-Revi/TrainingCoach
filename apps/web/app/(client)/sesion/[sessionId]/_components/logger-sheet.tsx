"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button, Icon, Tabs } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { EffortMode, SheetRow, LastRef } from "./_types";
import { LoggerSheetRepsRow } from "./logger-sheet-reps-row";
import { LoggerCardioTimer } from "./logger-cardio-timer";
import { LoggerHeader, LoggerFooter } from "./logger-parts";
import { useSounds } from "../_hooks/use-sounds";

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(secs);
}

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
  const [cardioTimerSeconds, setCardioTimerSeconds] = useState(0);
  const [hiddenTechniqueUrls, setHiddenTechniqueUrls] = useState<Record<string, boolean>>({});
  const wakeLockRef = useRef<{ release?: () => Promise<void> } | null>(null);
  const lastCountdownRef = useRef<number | null>(null);
  const { playCountdown, playComplete, playStart } = useSounds();
  const techniqueImageUrl = useMemo(() => {
    const img = ex.media.find((m) => m.mediaType === "image");
    return img?.url ?? ex.exercise.thumbnailUrl ?? null;
  }, [ex.exercise.thumbnailUrl, ex.media]);

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
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 1300 }}
      onClick={onClose}
    >
      {techniqueImageUrl && !hiddenTechniqueUrls[techniqueImageUrl] && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "16px 16px 10px", pointerEvents: "none" }}>
          <div
            style={{
              width: "100%",
              maxWidth: 320,
              aspectRatio: "16 / 9",
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--line-2)",
              background: "linear-gradient(135deg, rgba(20,20,24,.95), rgba(11,11,12,.9))",
              boxShadow: "0 14px 40px rgba(0,0,0,.35)",
            }}
          >
            <Image
              src={techniqueImageUrl}
              alt={`Técnica de ${ex.exercise.name}`}
              fill
              sizes="(max-width: 540px) calc(100vw - 32px), 320px"
              style={{ objectFit: "cover" }}
              unoptimized
              onError={() => {
                setHiddenTechniqueUrls((prev) => ({ ...prev, [techniqueImageUrl]: true }));
              }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.28))" }} />
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(11,11,12,.72)",
                border: "1px solid var(--line-2)",
                color: "var(--text)",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="image" size={12} color="var(--text)" />
              Técnica
            </div>
          </div>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 540,
          background: "var(--bg-1)", borderRadius: "16px 16px 0 0",
          padding: "14px 14px 18px",
          paddingBottom: "calc(18px + env(safe-area-inset-bottom))",
          maxHeight: "calc(100dvh - 40px)", overflow: "auto",
        }}
      >
        <LoggerHeader ex={ex} lastRef={lastRef} />

        {isCardioPure ? (
          <LoggerCardioTimer
            targetSeconds={ex.target?.durationSeconds}
            onSave={async (seconds) => {
              await saveSheet({ rows: [{ setNumber: 1, duration: String(seconds), reps: "", kg: "", effort: "" }] });
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
                  <div key={row.setNumber} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, alignItems: "center" }}>
                    <div className="ta-mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--text-mute)" }}>{row.setNumber}</div>
                    <div style={{ position: "relative" }}>
                      {isTimingThis ? (
                        <div style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--lime)", borderRadius: 10, padding: "10px 0", fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--lime)", width: "100%" }}>
                          {formatSeconds(timerSecondsLeft)}
                        </div>
                      ) : (
                        <input
                          type="number" inputMode="decimal" value={row.duration}
                          onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, duration: e.target.value } : r))}
                          placeholder={row.durationPlaceholder ?? String(ex.target.durationSeconds)}
                          style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                        />
                      )}
                    </div>
                    <input
                      type="number" inputMode="decimal" value={row.kg}
                      onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, kg: e.target.value } : r))}
                      placeholder={row.kgPlaceholder ?? "—"}
                      style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                    />
                    <input
                      type="number" inputMode="decimal" value={row.effort}
                      onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, effort: e.target.value } : r))}
                      placeholder={row.effortPlaceholder ?? (ex.target?.intensityTarget != null ? String(ex.target.intensityTarget) : "—")}
                      style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                    />
                    {isTimingThis ? (
                      <button onClick={() => { setActiveTimerRow(null); setTimerEndsAtMs(null); setTimerSecondsLeft(0); }} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--lime)", background: "rgba(215,255,58,.1)", color: "var(--lime)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                        Parar
                      </button>
                    ) : row.isSaved ? (
                      <button onClick={() => deleteSet(row.setNumber)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                        Borrar
                      </button>
                    ) : (
                      <button onClick={() => {
                        const duration = ex.target?.durationSeconds ?? 0;
                        setActiveTimerRow(row.setNumber);
                        setTimerSecondsLeft(duration);
                        setTimerEndsAtMs(Date.now() + duration * 1000);
                        playStart();
                      }} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                        <Icon name="timer" size={14} />
                      </button>
                    )}
                  </div>
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
                  if (last.isSaved || last.reps || last.kg || last.effort) return prev;
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
          </>
        )}

        <LoggerFooter
          isCardioPure={isCardioPure}
          cardioTimerSeconds={cardioTimerSeconds}
          sheetSaving={sheetSaving}
          onClose={onClose}
          saveSheet={saveSheet}
          ex={ex}
        />
      </div>
    </div>
  );
}
