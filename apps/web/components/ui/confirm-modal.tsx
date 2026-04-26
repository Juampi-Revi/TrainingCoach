"use client";

import { useEffect } from "react";
import { Button } from "./button";

interface ConfirmModalProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2000, padding: "0 24px",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 360,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: "24px 20px 20px",
        }}
      >
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text)", margin: "0 0 20px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" block onClick={onCancel}>{cancelLabel}</Button>
          <Button
            block
            onClick={onConfirm}
            style={destructive ? { background: "var(--danger)", color: "#fff", border: "none" } : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
