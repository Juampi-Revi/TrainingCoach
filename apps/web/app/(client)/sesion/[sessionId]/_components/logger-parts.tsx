"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { LastRef } from "./_types";
import { WorkoutLabelChips } from "@/components/features/training/workout-label-chips";

export function LoggerHeader({ ex, lastRef }: { ex: SessionExercise; lastRef: LastRef | null }) {
  const isExtra = !!(ex.block?.isExtra || (ex.supersetGroup && ex.target?.groupIsExtra));
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
  isCardioPure,
  cardioTimerSeconds,
  sheetSaving,
  onClose,
  saveSheet,
  ex,
}: {
  isCardioPure: boolean;
  cardioTimerSeconds: number;
  sheetSaving: boolean;
  onClose: () => void;
  saveSheet: (opts?: { startRest?: boolean; rows?: { setNumber: number; duration: string; reps: string; kg: string; effort: string }[] }) => Promise<void>;
  ex: SessionExercise;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <button
        style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        onClick={onClose}
      >
        Volver
      </button>
      {!isCardioPure && (
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
      )}
      <button
        style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "var(--lime)", color: "var(--bg-1)", fontSize: 15, fontWeight: 800, cursor: sheetSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        disabled={sheetSaving}
        onClick={async () => {
          if (isCardioPure && cardioTimerSeconds > 0) {
            await saveSheet({ rows: [{ setNumber: 1, duration: String(cardioTimerSeconds), reps: "", kg: "", effort: "" }] });
            onClose();
            return;
          }
          await saveSheet();
        }}
      >
        <Icon name="check" size={16} color="var(--bg-1)" />
        {sheetSaving ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
