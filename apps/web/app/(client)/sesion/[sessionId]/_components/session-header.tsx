"use client";

import { Icon } from "@/components/ui";

export function SessionHeader({
  exNum, exTotal, title, subtitle, time, onExit,
}: {
  exNum: number; exTotal: number; title: string; subtitle?: string; time?: string; onExit: () => void;
}) {
  return (
    <div style={{ position: "relative", padding: "50px 14px 12px", borderBottom: "1px solid var(--line)", background: "var(--bg)" }}>
      <button
        type="button"
        onClick={onExit}
        aria-label="Salir a la semana"
        title="Salir"
        style={{
          minWidth: 44, height: 36, borderRadius: 9, padding: "0 10px",
          background: "var(--bg-2)", border: "1px solid var(--line-2)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          color: "var(--text)", cursor: "pointer",
          position: "absolute", top: 48, left: 12,
          fontSize: 12, fontWeight: 700,
        }}
      >
        <Icon name="x" size={14} />
        <span style={{ color: "var(--text-mute)" }}>Salir</span>
      </button>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, textAlign: "center", marginTop: 6 }}>
        EJERCICIO {exNum} / {exTotal}
      </div>
      {time && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              color: "var(--text)",
            }}
          >
            <Icon name="timer" size={12} color="var(--text-mute)" />
            <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700 }}>{time}</span>
          </div>
        </div>
      )}
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em", textAlign: "center", marginTop: 8 }}>
        {title}
      </div>
      {subtitle && (
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", textAlign: "center", marginTop: 2 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
