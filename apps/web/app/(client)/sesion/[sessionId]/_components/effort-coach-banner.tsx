"use client";

import { analyzeSet, describeSetEffort } from "@/lib/effort";
import type { EffortMode, SheetRow } from "./_types";
import type { SessionExercise } from "@regen/types";

export function EffortCoachBanner({
  ex,
  rows,
  effortMode,
}: {
  ex: SessionExercise;
  rows: SheetRow[];
  effortMode: EffortMode;
}) {
  const last = [...rows].reverse().find((row) => row.effort.trim() || row.isSaved);
  if (!last) return null;
  const effort = Number(last.effort);
  const rpe = effortMode === "RPE" ? effort : null;
  const rir = effortMode === "RIR" ? effort : null;
  const target = ex.target?.intensityTarget != null ? Number(ex.target.intensityTarget) : null;
  const analysis = analyzeSet({
    reps: last.reps ? Number(last.reps) : null,
    weight: last.kg ? Number(last.kg) : null,
    rpe: Number.isFinite(rpe) ? rpe : null,
    rir: Number.isFinite(rir) ? rir : null,
    blockType: ex.block?.type,
  });
  const copy = describeSetEffort(analysis.kind, Number.isFinite(target) ? target : null);
  const color = copy.tone === "good" ? "var(--lime)" : copy.tone === "warn" ? "var(--warn)" : "var(--text-mute)";

  return (
    <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, border: `1px solid ${color}`, background: "color-mix(in srgb, var(--bg-2) 80%, transparent)" }}>
      <div className="ta-mono" style={{ fontSize: 9, letterSpacing: ".1em", fontWeight: 700, color }}>{copy.title.toUpperCase()}</div>
      <div style={{ fontSize: 12, color: "var(--text)", marginTop: 4, lineHeight: 1.4 }}>{copy.body}</div>
      {analysis.effectiveReps > 0 && (
        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
          ~{analysis.effectiveReps} reps efectivas{analysis.e1rm ? ` · e1RM ${analysis.e1rm} kg` : ""}
        </div>
      )}
    </div>
  );
}
