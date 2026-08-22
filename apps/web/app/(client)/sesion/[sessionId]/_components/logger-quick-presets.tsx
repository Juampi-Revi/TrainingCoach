"use client";

import type { EffortMode, SheetRow, LastRef } from "./_types";
import type { SessionExercise } from "@regen/types";

export function LoggerQuickPresets({
  sheetRows,
  setSheetRows,
  lastRef,
  effortMode,
  ex,
}: {
  sheetRows: SheetRow[];
  setSheetRows: React.Dispatch<React.SetStateAction<SheetRow[]>>;
  lastRef: LastRef | null;
  effortMode: EffortMode;
  ex: SessionExercise;
}) {
  if (ex.target?.durationSeconds) return null;

  const target = firstEditableRow(sheetRows);
  if (!target) return null;

  const source = lastSavedRow(sheetRows) ?? (lastRef
    ? {
        kg: lastRef.weight != null ? String(lastRef.weight) : "",
        reps: lastRef.reps != null ? String(lastRef.reps) : "",
        effort: (effortMode === "RPE" ? lastRef.rpe : lastRef.rir) != null
          ? String(effortMode === "RPE" ? lastRef.rpe : lastRef.rir)
          : "",
      }
    : null);

  function apply(patch: Partial<Pick<SheetRow, "kg" | "reps" | "effort">>) {
    setSheetRows((prev) =>
      prev.map((r) => (r.setNumber === target!.setNumber ? { ...r, ...patch } : r)),
    );
  }

  function sameAsLast() {
    if (!source) return;
    apply({
      kg: source.kg || target!.kg,
      reps: source.reps || target!.reps,
      effort: source.effort || target!.effort,
    });
  }

  function bump(pct: number) {
    const base = Number(target!.kg || source?.kg || 0);
    if (!Number.isFinite(base) || base <= 0) return;
    const next = Math.round(base * (1 + pct) * 2) / 2;
    apply({
      kg: Number.isInteger(next) ? String(next) : next.toFixed(1),
      reps: target!.reps || source?.reps || "",
      effort: target!.effort || source?.effort || "",
    });
  }

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
      <PresetChip label="Igual que última" onClick={sameAsLast} disabled={!source} primary />
      <PresetChip label="−5%" onClick={() => bump(-0.05)} disabled={!Number(target.kg || source?.kg)} />
      <PresetChip label="+5%" onClick={() => bump(0.05)} disabled={!Number(target.kg || source?.kg)} />
    </div>
  );
}

function PresetChip({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${primary ? "var(--lime)" : "var(--line-2)"}`,
        background: primary ? "color-mix(in srgb, var(--lime) 12%, transparent)" : "transparent",
        color: disabled ? "var(--text-dim)" : primary ? "var(--lime)" : "var(--text)",
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {label}
    </button>
  );
}

function firstEditableRow(rows: SheetRow[]): SheetRow | null {
  return rows.find((r) => !r.isSaved) ?? rows[rows.length - 1] ?? null;
}

function lastSavedRow(rows: SheetRow[]): { kg: string; reps: string; effort: string } | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i]!;
    if (r.isSaved && (r.kg || r.reps)) {
      return { kg: r.kg, reps: r.reps, effort: r.effort };
    }
  }
  const filled = [...rows].reverse().find((r) => r.kg || r.reps);
  return filled ? { kg: filled.kg, reps: filled.reps, effort: filled.effort } : null;
}
