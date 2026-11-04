"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { EffortMode, LastRef, SheetRow } from "./_types";
import { WorkoutLabelChips } from "@/components/features/training/workout-label-chips";
import { recommendedRestSeconds } from "../_lib/recommended-rest";

export function LoggerHeader({
  ex,
  lastRef,
  compact = false,
}: {
  ex: SessionExercise;
  lastRef: LastRef | null;
  compact?: boolean;
}) {
  const isExtra = !!(ex.block?.isExtra || (ex.supersetGroup && ex.target?.groupIsExtra));
  if (compact) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 6 }}>
          {ex.sets.length}/{ex.target?.sets ?? "—"} series · objetivo RPE/RIR {ex.target?.intensityTarget ?? "—"}
        </div>
        {lastRef && (
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", display: "flex", flexWrap: "wrap", gap: "0 6px" }}>
            <span>Última:</span>
            <span style={{ color: "var(--text-dim)", fontWeight: 700 }}>
              {lastRef.weight} kg × {lastRef.reps} rep
            </span>
            {lastRef.rpe != null && <span style={{ color: "var(--lime)" }}>· RPE {lastRef.rpe}</span>}
            {lastRef.rpe == null && lastRef.rir != null && <span style={{ color: "var(--lime)" }}>· RIR {lastRef.rir}</span>}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ex.exercise.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
          {ex.sets.length}/{ex.target?.sets ?? "—"} series
        </div>
        <div style={{ marginTop: 6 }}>
          <WorkoutLabelChips
            labels={{
              role: ex.target?.labels.role ?? null,
              effort: ex.target?.labels.effort ?? null,
              execution: ex.target?.labels.execution ?? null,
            }}
            isExtra={isExtra}
            compact
          />
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
  );
}

export function LoggerFooter({
  sheetSaving,
  onClose,
  saveSheet,
  ex,
  sheetRows,
  effortMode,
  advancesSuperset,
  onContinue,
}: {
  sheetSaving: boolean;
  onClose: () => void;
  saveSheet: (opts?: { startRest?: boolean; restSeconds?: number; rows?: SheetRow[] }) => Promise<boolean>;
  ex: SessionExercise;
  sheetRows: SheetRow[];
  effortMode: EffortMode;
  advancesSuperset: boolean;
  onContinue: (restSeconds: number) => void;
}) {
  const lastEffort = [...sheetRows].reverse().find((r) => r.effort)?.effort;
  const restSec = recommendedRestSeconds(ex, lastEffort, effortMode);
  const [restPick, setRestPick] = useState(String(restSec));

  useEffect(() => {
    setRestPick(String(recommendedRestSeconds(ex, undefined, effortMode)));
    // Solo al cambiar de ejercicio: el alumno puede editar el número a mano.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);
  const wasSaving = useRef(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (wasSaving.current && !sheetSaving) {
      setJustSaved(true);
      const t = window.setTimeout(() => setJustSaved(false), 1600);
      return () => window.clearTimeout(t);
    }
    wasSaving.current = sheetSaving;
  }, [sheetSaving]);

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 0 }}>
      <button
        type="button"
        style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        onClick={onClose}
      >
        Cerrar
      </button>
      <label style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px", borderRadius: 12, border: "1px solid var(--line-2)", color: "var(--text-mute)", fontSize: 12, fontWeight: 700 }}>
        <input
          type="number"
          min={5}
          inputMode="numeric"
          aria-label="Segundos de descanso"
          value={restPick}
          onChange={(event) => setRestPick(event.target.value)}
          style={{ width: 52, border: "none", background: "transparent", color: "var(--text)", fontSize: 14, fontWeight: 700, textAlign: "right" }}
        />
        s
      </label>
      <button
        type="button"
        onClick={() => {
          const seconds = Math.max(5, Math.round(Number(restPick) || restSec));
          onContinue(seconds);
        }}
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
        {advancesSuperset ? "Siguiente" : "Descanso"}
      </button>
      <button
        type="button"
        className={justSaved ? "ta-save-ok" : undefined}
        style={{ flex: 1.6, padding: "12px 0", borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--text-on-accent)", fontSize: 14, fontWeight: 800, cursor: sheetSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        disabled={sheetSaving}
        onClick={() => { void saveSheet(); }}
      >
        <Icon name="check" size={16} color="var(--text-on-accent)" />
        {sheetSaving ? "Guardando…" : justSaved ? "Guardado ✓" : "Guardar series"}
      </button>
    </div>
  );
}
