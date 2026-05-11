"use client";

import { Modal } from "@/components/shared/modal";
import { Button } from "@/components/ui";

export function PlanProgressionNoteModal({
  open,
  workoutTitle,
  value,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  workoutTitle: string;
  value: string;
  saving: boolean;
  onChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Nota de progresión" maxWidth={560}>
      <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 12 }}>
        {workoutTitle}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Semana 2: +1 serie en press / bajar descanso / subir carga 2.5kg…"
        style={{
          width: "100%",
          minHeight: 120,
          resize: "vertical",
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 12,
          padding: 12,
          color: "var(--text)",
          outline: "none",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          lineHeight: 1.4,
        }}
      />

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </Modal>
  );
}
