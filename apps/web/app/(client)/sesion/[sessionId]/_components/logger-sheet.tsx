"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button, Icon, Tabs } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { EffortMode, SheetRow, LastRef } from "./_types";
import { LoggerSheetRepsRow } from "./logger-sheet-reps-row";

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
  lastRef,
  sheetSaving,
  saveSheet,
  saveRow,
  deleteSet,
  onClose,
}: {
  ex: SessionExercise;
  sessionId: string;
  sheetRows: SheetRow[];
  setSheetRows: Dispatch<SetStateAction<SheetRow[]>>;
  effortMode: EffortMode;
  setEffortMode: Dispatch<SetStateAction<EffortMode>>;
  equipmentType: "barra" | "mancuernas" | "maquina" | null;
  setEquipmentType: Dispatch<SetStateAction<"barra" | "mancuernas" | "maquina" | null>>;
  activeTimerRow: number | null;
  setActiveTimerRow: Dispatch<SetStateAction<number | null>>;
  timerSecondsLeft: number;
  setTimerSecondsLeft: Dispatch<SetStateAction<number>>;
  lastRef: LastRef | null;
  sheetSaving: boolean;
  saveSheet: (opts?: { startRest?: boolean }) => Promise<void>;
  saveRow: (setNumber: number, opts?: { startRest?: boolean }) => Promise<void>;
  deleteSet: (setNumber: number) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1300 }}
      onClick={onClose}
    >
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text)", cursor: "pointer", flexShrink: 0 }}
          >
            <Icon name="x" size={14} color="var(--text)" />
          </button>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ex.exercise.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
              {ex.sets.length}/{ex.target?.sets ?? "—"} series
            </div>
            {lastRef && (
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 6px" }}>
                <span>Última vez:</span>
                <span style={{ color: "var(--text-dim)", fontWeight: 700 }}>
                  {lastRef.weight} kg × {lastRef.reps} rep
                </span>
                {(lastRef.notes === "barra" || lastRef.notes === "mancuernas" || lastRef.notes === "maquina") && (
                  <span>· {lastRef.notes === "barra" ? "Barra" : lastRef.notes === "mancuernas" ? "Mancu." : "Máq."}</span>
                )}
                {lastRef.rpe != null && <span style={{ color: "var(--lime)" }}>· RPE {lastRef.rpe}</span>}
                {lastRef.rpe == null && lastRef.rir != null && <span style={{ color: "var(--lime)" }}>· RIR {lastRef.rir}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Equipment selector */}
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

        {/* Effort mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Esfuerzo</span>
          <Tabs variant="pills" tabs={["RPE", "RIR"]} active={effortMode} onChange={(t) => setEffortMode(t as EffortMode)} />
        </div>

        {/* Column headers */}
        {ex.target?.durationSeconds ? (
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, padding: "0 2px 8px", fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>
            <div>Serie</div><div style={{ textAlign: "center" }}>seg</div><div style={{ textAlign: "center" }}>kg</div><div style={{ textAlign: "center" }}>{effortMode}</div><div />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, padding: "0 2px 8px", fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>
            <div>Serie</div><div style={{ textAlign: "center" }}>kg</div><div style={{ textAlign: "center" }}>reps</div><div style={{ textAlign: "center" }}>{effortMode}</div><div />
          </div>
        )}

        {/* Set rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sheetRows.map((row) => {
            const isTimingThis = activeTimerRow === row.setNumber;
            return ex.target?.durationSeconds ? (
              <div key={row.setNumber} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, alignItems: "center" }}>
                <div className="ta-mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--text-mute)" }}>{row.setNumber}</div>
                <div style={{ position: "relative" }}>
                  {isTimingThis ? (
                    <div style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--lime)", borderRadius: 10, padding: "10px 0", fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--lime)", width: "100%" }}>
                      {timerSecondsLeft}
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
                  <button onClick={() => setActiveTimerRow(null)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--lime)", background: "rgba(215,255,58,.1)", color: "var(--lime)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    Parar
                  </button>
                ) : row.existingId ? (
                  <button onClick={() => deleteSet(row.setNumber)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    Borrar
                  </button>
                ) : (
                  <button onClick={() => { setActiveTimerRow(row.setNumber); setTimerSecondsLeft(ex.target!.durationSeconds!); }} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    <Icon name="timer" size={14} />
                  </button>
                )}
              </div>
            ) : (
              <LoggerSheetRepsRow
                key={row.setNumber}
                ex={ex}
                row={row}
                sheetSaving={sheetSaving}
                setSheetRows={setSheetRows}
                saveRow={saveRow}
                deleteSet={deleteSet}
              />
            );
          })}
        </div>

        {/* Series controls */}
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <button
            onClick={() => setSheetRows((prev) => {
              if (prev.length <= 1) return prev;
              const last = prev[prev.length - 1]!;
              if (last.existingId || last.reps || last.kg || last.effort) return prev;
              return prev.slice(0, -1);
            })}
            style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            − Quitar serie
          </button>
          <button
            onClick={() => {
              const repsPh =
                lastRef?.reps != null
                  ? String(lastRef.reps)
                  : ex.target?.reps != null
                    ? String(ex.target.reps)
                    : undefined;
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

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={onClose}>
            Volver
          </Button>
          <button
            onClick={() => saveSheet({ startRest: true })}
            disabled={sheetSaving}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12,
              border: "1px solid var(--line-2)", background: "transparent",
              color: "var(--text-mute)", fontSize: 13, fontWeight: 700,
              cursor: sheetSaving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <Icon name="timer" size={13} color="var(--text-mute)" />
            {ex.target?.restSeconds ? `${ex.target.restSeconds}s` : "Descanso"}
          </button>
          <Button size="lg" style={{ flex: 2 }} disabled={sheetSaving} onClick={() => saveSheet()} icon="check">
            {sheetSaving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
