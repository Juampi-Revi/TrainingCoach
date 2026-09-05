"use client";

import { Icon } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import type { SheetRow } from "./_types";
import { markRowDirty } from "../_lib/logger-save";

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(secs);
}

export function LoggerSheetTimedRow({
  ex,
  row,
  isTimingThis,
  timerSecondsLeft,
  setSheetRows,
  deleteSet,
  onStartTimer,
  onStopTimer,
}: {
  ex: SessionExercise;
  row: SheetRow;
  isTimingThis: boolean;
  timerSecondsLeft: number;
  setSheetRows: React.Dispatch<React.SetStateAction<SheetRow[]>>;
  deleteSet: (setNumber: number) => Promise<void>;
  onStartTimer: () => void;
  onStopTimer: () => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, alignItems: "center" }}>
      <div className="ta-mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--text-mute)" }}>{row.setNumber}</div>
      <div style={{ position: "relative" }}>
        {isTimingThis ? (
          <div style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--lime)", borderRadius: 10, padding: "10px 0", fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--lime)", width: "100%" }}>
            {formatSeconds(timerSecondsLeft)}
          </div>
        ) : (
          <input
            type="number" inputMode="decimal" value={row.duration}
            onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? markRowDirty(r, { duration: e.target.value }) : r))}
            placeholder={row.durationPlaceholder ?? String(ex.target?.durationSeconds ?? "")}
            style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
          />
        )}
      </div>
      <input
        type="number" inputMode="decimal" value={row.kg}
        onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? markRowDirty(r, { kg: e.target.value }) : r))}
        placeholder={row.kgPlaceholder ?? "—"}
        style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
      />
      <input
        type="number" inputMode="decimal" value={row.effort}
        onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? markRowDirty(r, { effort: e.target.value }) : r))}
        placeholder={row.effortPlaceholder ?? (ex.target?.intensityTarget != null ? String(ex.target.intensityTarget) : "—")}
        style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
      />
      {isTimingThis ? (
        <button onClick={onStopTimer} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--lime)", background: "color-mix(in srgb, var(--lime) 10%, transparent)", color: "var(--lime)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          Parar
        </button>
      ) : row.isSaved ? (
        <button onClick={() => deleteSet(row.setNumber)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
          Borrar
        </button>
      ) : (
        <button onClick={onStartTimer} style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
          <Icon name="timer" size={14} />
        </button>
      )}
    </div>
  );
}
