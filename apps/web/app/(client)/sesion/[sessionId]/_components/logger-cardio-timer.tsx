"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui";

function formatCardioTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTarget(targetSeconds: number) {
  if (targetSeconds >= 60 && targetSeconds % 60 === 0) return `${targetSeconds / 60} min`;
  if (targetSeconds >= 60) {
    const m = Math.floor(targetSeconds / 60);
    const s = targetSeconds % 60;
    return `${m}m ${s}s`;
  }
  return `${targetSeconds}s`;
}

export function LoggerCardioTimer({
  targetSeconds,
  onSave,
  onClose,
  sheetSaving,
}: {
  targetSeconds: number | null | undefined;
  onSave: (seconds: number) => void;
  onClose: () => void;
  sheetSaving: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "12px 0 6px" }}>
      <div style={{ fontSize: 56, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text)", lineHeight: 1 }}>
        {formatCardioTime(seconds)}
      </div>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        {!running ? (
          <button
            type="button"
            onClick={() => setRunning(true)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", background: "var(--lime)", color: "var(--bg-1)", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Icon name="play" size={16} color="var(--bg-1)" /> Iniciar timer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid var(--lime)", background: "color-mix(in srgb, var(--lime) 10%, transparent)", color: "var(--lime)", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Icon name="pause" size={16} color="var(--lime)" /> Pausar
          </button>
        )}
        <button
          type="button"
          onClick={() => { setRunning(false); setSeconds(0); }}
          style={{ padding: "14px 18px", borderRadius: 12, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Reiniciar
        </button>
      </div>
      {targetSeconds ? (
        <div style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>
          Objetivo: {formatTarget(targetSeconds)}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 8 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={() => onSave(seconds)}
          disabled={sheetSaving || seconds <= 0}
          style={{ flex: 2, padding: "14px 0", borderRadius: 12, border: "none", background: "var(--lime)", color: "var(--bg-1)", fontSize: 15, fontWeight: 800, cursor: sheetSaving || seconds <= 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: seconds <= 0 ? 0.55 : 1 }}
        >
          <Icon name="check" size={16} color="var(--bg-1)" />
          {sheetSaving ? "Guardando…" : "Guardar tiempo"}
        </button>
      </div>
    </div>
  );
}
