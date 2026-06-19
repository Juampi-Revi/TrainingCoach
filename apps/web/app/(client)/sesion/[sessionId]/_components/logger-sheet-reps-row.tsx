"use client";

import type { Dispatch, SetStateAction } from "react";
import { Icon } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { SheetRow } from "./_types";

export function LoggerSheetRepsRow({
  ex,
  row,
  setSheetRows,
  deleteSet,
}: {
  ex: SessionExercise;
  row: SheetRow;
  setSheetRows: Dispatch<SetStateAction<SheetRow[]>>;
  deleteSet: (setNumber: number) => Promise<void>;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, alignItems: "center" }}>
      <div className="ta-mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--text-mute)" }}>{row.setNumber}</div>
      <input
        type="number"
        inputMode="decimal"
        value={row.kg}
        onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, kg: e.target.value } : r))}
        placeholder={row.kgPlaceholder ?? "—"}
        style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
      />
      <input
        type="number"
        inputMode="decimal"
        value={row.reps}
        onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, reps: e.target.value } : r))}
        placeholder={row.repsPlaceholder ?? (ex.target?.reps != null ? String(ex.target.reps) : "—")}
        style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
      />
      <input
        type="number"
        inputMode="decimal"
        value={row.effort}
        onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, effort: e.target.value } : r))}
        placeholder={row.effortPlaceholder ?? (ex.target?.intensityTarget != null ? String(ex.target.intensityTarget) : "—")}
        style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
      />
      {row.isSaved ? (
        <button onClick={() => deleteSet(row.setNumber)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
          Borrar
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
