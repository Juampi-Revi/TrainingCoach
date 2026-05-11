"use client";

import { Icon } from "@/components/ui";

export function PlanGridWeekActionsMenu({
  open,
  weekNumber,
  canPasteWeek,
  canDuplicateToNext,
  hasAnyWorkouts,
  pos,
  onClose,
  onCopyWeek,
  onPasteWeek,
  onDuplicateWeek,
  onClearWeek,
}: {
  open: boolean;
  weekNumber: number;
  canPasteWeek: boolean;
  canDuplicateToNext: boolean;
  hasAnyWorkouts: boolean;
  pos: { top: number; left: number } | null;
  onClose: () => void;
  onCopyWeek: (weekNumber: number) => void;
  onPasteWeek: (weekNumber: number) => void;
  onDuplicateWeek: (fromWeekNumber: number, toWeekNumber: number) => void;
  onClearWeek: (weekNumber: number) => void;
}) {
  if (!open || !pos) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={onClose} />
      <div
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: 240,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          boxShadow: "var(--shadow-md)",
          zIndex: 3000,
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => {
            onClose();
            onCopyWeek(weekNumber);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
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
          title="Copiar el contenido de esta semana"
        >
          <Icon name="refresh" size={14} color="var(--text-mute)" /> Copiar semana
        </button>

        <button
          onClick={() => {
            if (!canPasteWeek) return;
            onClose();
            onPasteWeek(weekNumber);
          }}
          disabled={!canPasteWeek}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "none",
            border: "none",
            cursor: canPasteWeek ? "pointer" : "not-allowed",
            textAlign: "left",
            fontSize: 13,
            color: canPasteWeek ? "var(--text)" : "var(--text-mute)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: canPasteWeek ? 1 : 0.6,
          }}
          className="ta-row"
          title={canPasteWeek ? "Pegar en esta semana" : "Copiá una semana primero"}
        >
          <Icon name="reset" size={14} color="var(--text-mute)" /> Pegar semana
        </button>

        <button
          onClick={() => {
            if (!canDuplicateToNext || !hasAnyWorkouts) return;
            onClose();
            onDuplicateWeek(weekNumber, weekNumber + 1);
          }}
          disabled={!canDuplicateToNext || !hasAnyWorkouts}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "none",
            border: "none",
            cursor: canDuplicateToNext && hasAnyWorkouts ? "pointer" : "not-allowed",
            textAlign: "left",
            fontSize: 13,
            color: canDuplicateToNext && hasAnyWorkouts ? "var(--text)" : "var(--text-mute)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: canDuplicateToNext && hasAnyWorkouts ? 1 : 0.6,
          }}
          className="ta-row"
          title={canDuplicateToNext ? `Duplicar a S${weekNumber + 1}` : "No hay semana siguiente"}
        >
          <Icon name="repeat" size={14} color="var(--text-mute)" /> Duplicar a S{weekNumber + 1}
        </button>

        <button
          onClick={() => {
            onClose();
            onClearWeek(weekNumber);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
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
          title="Quitar todos los entrenos de esta semana"
        >
          <Icon name="trash" size={14} color="var(--danger)" /> Limpiar semana
        </button>
      </div>
    </>
  );
}
