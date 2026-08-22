"use client";

import { Button } from "@/components/ui";
import type { CellData, WeekMetaState } from "./types";

export function PlanStudentWeeks({
  grid,
  weekMeta,
  onOpenFullPreview,
  onOpenWorkout,
}: {
  grid: Array<Array<CellData | null>>;
  weekMeta: WeekMetaState;
  onOpenFullPreview: () => void;
  onOpenWorkout: (templateId: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid var(--line)",
          background: "var(--bg-1)",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Así lo ve el alumno</div>
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
            Resumen por semana. Abrí la vista completa para progreso real y notas.
          </div>
        </div>
        <Button size="sm" variant="secondary" icon="eye" onClick={onOpenFullPreview}>
          Vista completa
        </Button>
      </div>

      {grid.map((week, wi) => {
        const weekNumber = wi + 1;
        const meta = weekMeta[weekNumber];
        const filled = week.filter((c): c is CellData => !!c);
        return (
          <section
            key={weekNumber}
            style={{
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "var(--bg-1)",
              overflow: "hidden",
            }}
          >
            <header
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800 }}>Semana {weekNumber}</span>
              {meta?.title ? (
                <span style={{ fontSize: 13, color: "var(--text-mute)" }}>{meta.title}</span>
              ) : null}
              <span className="ta-mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-dim)" }}>
                {filled.length}/{week.length} días
              </span>
            </header>
            {meta?.notes ? (
              <p style={{ margin: 0, padding: "10px 14px", fontSize: 12, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                {meta.notes}
              </p>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderTop: di === 0 ? "none" : "1px solid var(--line)",
                    opacity: cell ? 1 : 0.55,
                  }}
                >
                  <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-dim)", width: 28 }}>
                    D{di + 1}
                  </span>
                  {cell ? (
                    <button
                      type="button"
                      onClick={() => onOpenWorkout(cell.templateId)}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: "var(--text)",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{cell.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                        {cell.exerciseCount} ejercicios
                        {cell.progressionNote ? ` · ${cell.progressionNote}` : ""}
                      </div>
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Descanso</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
