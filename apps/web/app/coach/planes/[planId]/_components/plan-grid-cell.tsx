"use client";

import { Icon } from "@/components/ui";
import type { CellData } from "./types";

export function PlanGridCell({
  wi,
  di,
  cell,
  colors,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onEmptyClick,
  onChangeWorkout,
  onEditProgressionNote,
  onClear,
  onViewWorkout,
  onOpenLibrary,
  onMoveCell,
  compact = false,
}: {
  wi: number;
  di: number;
  cell: CellData | null;
  colors: { bg: string; b: string; t: string };
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onEmptyClick: () => void;
  onChangeWorkout: () => void;
  onEditProgressionNote: () => void;
  onClear: () => void;
  onViewWorkout: () => void;
  onOpenLibrary: () => void;
  onMoveCell: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) => void;
  compact?: boolean;
}) {
  const cellHeight = compact ? 36 : 52;
  if (!cell) {
    return (
      <div
        onClick={onEmptyClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const parsed = parseDragPayload(e.dataTransfer.getData("text/plain"));
          if (!parsed) return;
          onMoveCell(parsed.weekIndex, parsed.dayIndex, wi, di);
        }}
        style={{
          height: cellHeight,
          background: "var(--bg)",
          border: "1px dashed var(--line)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "border-color .12s, background .12s",
        }}
        className="ta-row"
        title="Asignar workout"
      >
        <Icon name="plus" size={14} color="var(--text-dim)" />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", JSON.stringify({ weekIndex: wi, dayIndex: di }));
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const parsed = parseDragPayload(e.dataTransfer.getData("text/plain"));
          if (!parsed) return;
          onMoveCell(parsed.weekIndex, parsed.dayIndex, wi, di);
        }}
        onClick={onMenuToggle}
        style={{
          height: cellHeight,
          padding: compact ? "4px 6px" : "6px 8px",
          borderRadius: 8,
          background: colors.bg,
          border: `1px solid ${colors.b}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: compact ? 0 : 2,
          cursor: "pointer",
        }}
        title="Arrastrar para mover · Click para opciones"
      >
        <div style={{ fontSize: compact ? 10 : 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cell.title}
        </div>
        {!compact && (
          <div className="ta-mono ta-ellipsis" style={{ fontSize: 10, color: cell.progressionNote ? "var(--accent-text)" : "var(--text-mute)" }}>
            {cell.exerciseCount} ej{cell.progressionNote ? ` · ${cell.progressionNote}` : ""}
          </div>
        )}
      </div>

      {isMenuOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={onMenuClose} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              minWidth: 160,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              boxShadow: "var(--shadow-md)",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => {
                onMenuClose();
                onViewWorkout();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              className="ta-row"
            >
              <Icon name="edit" size={13} /> Ver / editar
            </button>
            <button
              onClick={() => {
                onMenuClose();
                onOpenLibrary();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              className="ta-row"
            >
              <Icon name="book" size={13} /> Biblioteca de ejercicios
            </button>
            <button
              onClick={() => {
                onMenuClose();
                onEditProgressionNote();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              className="ta-row"
            >
              <Icon name="info" size={13} /> Nota de progresión
            </button>
            <button
              onClick={() => {
                onMenuClose();
                onChangeWorkout();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              className="ta-row"
            >
              <Icon name="reset" size={13} /> Cambiar workout
            </button>
            <button
              onClick={() => {
                onMenuClose();
                onClear();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13,
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderTop: "1px solid var(--line)",
              }}
              className="ta-row"
            >
              <Icon name="trash" size={13} color="var(--danger)" /> Quitar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function parseDragPayload(raw: string): { weekIndex: number; dayIndex: number } | null {
  try {
    const val = JSON.parse(raw) as unknown;
    if (!val || typeof val !== "object") return null;
    const rec = val as Record<string, unknown>;
    if (typeof rec.weekIndex !== "number" || typeof rec.dayIndex !== "number") return null;
    return { weekIndex: rec.weekIndex, dayIndex: rec.dayIndex };
  } catch {
    return null;
  }
}
