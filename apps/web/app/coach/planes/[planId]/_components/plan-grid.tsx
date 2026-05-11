"use client";

import type { CellData, WeekMetaState } from "./types";
import { PlanGridWeekRow } from "./plan-grid-week-row";

const WEEK_COL_WIDTH = 160;
const CELL_MIN_WIDTH = 120;

const PHASE_COLORS = {
  accum: { bg: "rgba(215,255,58,.1)", b: "rgba(215,255,58,.3)", t: "var(--lime)" },
  intens: { bg: "rgba(255,181,71,.1)", b: "rgba(255,181,71,.3)", t: "var(--warn)" },
  deload: { bg: "var(--bg-2)", b: "var(--line-2)", t: "var(--text-mute)" },
  test: { bg: "rgba(122,184,255,.1)", b: "rgba(122,184,255,.3)", t: "var(--info)" },
} as const;

function getPhase(wi: number, total: number): keyof typeof PHASE_COLORS {
  const pct = wi / total;
  if (pct >= 0.875) return "test";
  if (pct >= 0.75) return "deload";
  if (pct >= 0.375) return "intens";
  return "accum";
}

export function PlanGrid({
  cols,
  weeksCount,
  grid,
  weekMeta,
  expandedWeek,
  onToggleWeekExpand,
  onWeekMetaChange,
  onWeekMetaBlur,
  cellMenu,
  onCellMenuToggle,
  onCellMenuClose,
  onEmptyCellClick,
  onCellChangeWorkout,
  onCellEditProgressionNote,
  onCellClear,
  onViewWorkout,
  onMoveCell,
  canPasteWeek,
  onCopyWeek,
  onPasteWeek,
  onClearWeek,
  onDuplicateWeek,
}: {
  cols: number;
  weeksCount: number;
  grid: Array<Array<CellData | null>>;
  weekMeta: WeekMetaState;
  expandedWeek: number | null;
  onToggleWeekExpand: (weekNumber: number) => void;
  onWeekMetaChange: (weekNumber: number, patch: Partial<{ title: string; notes: string }>) => void;
  onWeekMetaBlur: (weekNumber: number) => void;
  cellMenu: { week: number; day: number } | null;
  onCellMenuToggle: (coords: { week: number; day: number }) => void;
  onCellMenuClose: () => void;
  onEmptyCellClick: (weekIndex: number, dayIndex: number) => void;
  onCellChangeWorkout: (weekIndex: number, dayIndex: number) => void;
  onCellEditProgressionNote: (weekIndex: number, dayIndex: number) => void;
  onCellClear: (weekIndex: number, dayIndex: number) => void;
  onViewWorkout: (templateId: string) => void;
  onMoveCell: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) => void;
  canPasteWeek: boolean;
  onCopyWeek: (weekNumber: number) => void;
  onPasteWeek: (weekNumber: number) => void;
  onClearWeek: (weekNumber: number) => void;
  onDuplicateWeek: (fromWeekNumber: number, toWeekNumber: number) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          fontSize: 11,
          color: "var(--text-mute)",
          flexWrap: "wrap",
        }}
      >
        {Object.entries({
          accum: "Acumulación",
          intens: "Intensificación",
          deload: "Deload",
          test: "Test",
        }).map(([key, label]) => {
          const c = PHASE_COLORS[key as keyof typeof PHASE_COLORS];
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c.t, opacity: 0.8 }} />
              {label}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
          Click para asignar · Arrastrá para mover
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: cols * CELL_MIN_WIDTH + WEEK_COL_WIDTH }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${WEEK_COL_WIDTH}px repeat(${cols}, minmax(${CELL_MIN_WIDTH}px, 1fr))`,
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div />
            {Array.from({ length: cols }, (_, i) => (
              <div
                key={i}
                className="ta-mono"
                style={{
                  fontSize: 10,
                  color: "var(--text-mute)",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 600,
                  padding: "6px 0",
                }}
              >
                D{i + 1}
              </div>
            ))}
          </div>

          {grid.map((week, wi) => {
            const phase = getPhase(wi, weeksCount);
            const phaseLabel = { accum: "Acum.", intens: "Intens.", deload: "Deload", test: "Test" }[phase];
            const colors = PHASE_COLORS[phase];

            return (
              <PlanGridWeekRow
                key={wi}
                wi={wi}
                week={week}
                cols={cols}
                weeksCount={weeksCount}
                colors={colors}
                phaseLabel={phaseLabel}
                expandedWeek={expandedWeek}
                weekMeta={weekMeta}
                onToggleWeekExpand={onToggleWeekExpand}
                onWeekMetaChange={onWeekMetaChange}
                onWeekMetaBlur={onWeekMetaBlur}
                cellMenu={cellMenu}
                onCellMenuToggle={onCellMenuToggle}
                onCellMenuClose={onCellMenuClose}
                onEmptyCellClick={onEmptyCellClick}
                onCellChangeWorkout={onCellChangeWorkout}
                onCellEditProgressionNote={onCellEditProgressionNote}
                onCellClear={onCellClear}
                onViewWorkout={onViewWorkout}
                onMoveCell={onMoveCell}
                canPasteWeek={canPasteWeek}
                onCopyWeek={onCopyWeek}
                onPasteWeek={onPasteWeek}
                onClearWeek={onClearWeek}
                onDuplicateWeek={onDuplicateWeek}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
