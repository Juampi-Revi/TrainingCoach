"use client";

import { Button } from "@/components/ui";

interface ResetModalProps {
  resetting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetModal({ resetting, onCancel, onConfirm }: ResetModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1200 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "24px 20px 36px" }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Reiniciar entrenamiento</div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 20, lineHeight: 1.5 }}>
          Se descartará el progreso actual y empezarás desde cero. Esta acción no se puede deshacer.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={onCancel}>Cancelar</Button>
          <button onClick={onConfirm} disabled={resetting}
            style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "var(--danger)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          >
            {resetting ? "Reiniciando…" : "Sí, reiniciar"}
          </button>
        </div>
      </div>
    </div>
  );
}