"use client";

import { useEffect, useRef, useState } from "react";
import type { CellData, WeekMetaState } from "./types";
import { PlanGridCell } from "./plan-grid-cell";
import { Button } from "@/components/ui";
import { PlanGridWeekActionsMenu } from "./plan-grid-week-actions-menu";

export function PlanGridWeekRow({
  wi,
  week,
  cols,
  weeksCount,
  colors,
  phaseLabel,
  expandedWeek,
  weekMeta,
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
  wi: number;
  week: Array<CellData | null>;
  cols: number;
  weeksCount: number;
  colors: { bg: string; b: string; t: string };
  phaseLabel: string;
  expandedWeek: number | null;
  weekMeta: WeekMetaState;
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsPos, setActionsPos] = useState<{ top: number; left: number } | null>(null);
  const actionsAnchorRef = useRef<HTMLDivElement | null>(null);
  const weekNumber = wi + 1;
  const hasAnyWorkouts = !week.every((c) => c === null);
  const canDuplicateToNext = weekNumber < weeksCount;

  useEffect(() => {
    if (!actionsOpen) return;
    const el = actionsAnchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const menuWidth = 240;
    const margin = 12;
    const top = rect.bottom + 8;
    const maxLeft = window.innerWidth - menuWidth - margin;
    const left = Math.max(margin, Math.min(rect.left, maxLeft));
    setActionsPos({ top, left });
  }, [actionsOpen]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `160px repeat(${cols}, minmax(120px, 1fr))`, gap: 6, marginBottom: 6 }}>
      <div>
        <button
          onClick={() => onToggleWeekExpand(weekNumber)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: expandedWeek === wi + 1 ? "var(--bg-2)" : "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: expandedWeek === wi + 1 ? "8px 8px 0 0" : 8,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            justifyContent: "center",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span className="ta-mono" style={{ color: "var(--text-mute)", fontSize: 10 }}>
            S{weekNumber}
          </span>
          <span
            style={{
              fontSize: 12,
              color: weekMeta[wi + 1]?.title ? "var(--text)" : "var(--text-mute)",
              fontWeight: weekMeta[wi + 1]?.title ? 600 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {weekMeta[wi + 1]?.title || phaseLabel}
          </span>
        </button>
        {expandedWeek === weekNumber && (
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              padding: "10px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "2px 2px 0" }}>
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".08em" }}>
                EDITAR SEMANA
              </div>
              <div ref={actionsAnchorRef}>
                <Button
                  size="sm"
                  variant="outline"
                  icon="more"
                  onClick={() => setActionsOpen((v) => !v)}
                  title="Acciones de semana"
                  ariaLabel="Acciones de semana"
                  style={{ padding: "0 10px", width: 36 }}
                >
                  <span style={{ display: "none" }}>Acciones</span>
                </Button>
              </div>
            </div>
            <input
              value={weekMeta[wi + 1]?.title ?? ""}
              onChange={(e) => onWeekMetaChange(wi + 1, { title: e.target.value })}
              onBlur={() => onWeekMetaBlur(wi + 1)}
              placeholder="Título semana…"
              style={{
                width: "100%",
                background: "var(--bg-1)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 13,
                color: "var(--text)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <textarea
              value={weekMeta[wi + 1]?.notes ?? ""}
              onChange={(e) => onWeekMetaChange(wi + 1, { notes: e.target.value })}
              onBlur={() => onWeekMetaBlur(wi + 1)}
              placeholder="Notas…"
              rows={2}
              style={{
                width: "100%",
                background: "var(--bg-1)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12,
                color: "var(--text)",
                lineHeight: 1.4,
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />

            <PlanGridWeekActionsMenu
              open={actionsOpen}
              weekNumber={weekNumber}
              canPasteWeek={canPasteWeek}
              canDuplicateToNext={canDuplicateToNext}
              hasAnyWorkouts={hasAnyWorkouts}
              pos={actionsPos}
              onClose={() => {
                setActionsOpen(false);
                setActionsPos(null);
              }}
              onCopyWeek={onCopyWeek}
              onPasteWeek={onPasteWeek}
              onDuplicateWeek={onDuplicateWeek}
              onClearWeek={onClearWeek}
            />
          </div>
        )}
      </div>

      {week.map((cell, di) => (
        <PlanGridCell
          key={di}
          wi={wi}
          di={di}
          cell={cell}
          colors={colors}
          isMenuOpen={cellMenu?.week === wi && cellMenu?.day === di}
          onMenuToggle={() => onCellMenuToggle({ week: wi, day: di })}
          onMenuClose={onCellMenuClose}
          onEmptyClick={() => onEmptyCellClick(wi, di)}
          onChangeWorkout={() => onCellChangeWorkout(wi, di)}
          onEditProgressionNote={() => onCellEditProgressionNote(wi, di)}
          onClear={() => onCellClear(wi, di)}
          onViewWorkout={() => onViewWorkout(cell?.templateId ?? "")}
          onMoveCell={onMoveCell}
        />
      ))}
    </div>
  );
}
