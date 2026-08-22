"use client";

import { Icon } from "@/components/ui";

export function SessionOfflineBanner({
  count,
  onRetry,
}: {
  count: number;
  onRetry: () => void;
}) {
  if (count <= 0) return null;
  return (
    <div style={{ background: "var(--warn)", color: "var(--bg)", padding: "8px 16px", margin: "8px 16px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Icon name="alert" size={13} color="var(--bg)" />
      {count} serie{count !== 1 ? "s" : ""} pendiente{count !== 1 ? "s" : ""} · se sincronizarán al reconectar
      <button onClick={onRetry} style={{ background: "color-mix(in srgb, var(--bg) 15%, transparent)", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--bg)" }}>
        Reintentar
      </button>
    </div>
  );
}

export function SessionExtrasBanner({
  extraBlockCount,
  extraGroupCount,
}: {
  extraBlockCount: number;
  extraGroupCount: number;
}) {
  const extraCount = extraBlockCount + extraGroupCount;
  if (extraCount <= 0) return null;
  return (
    <div style={{ margin: "8px 16px 0", padding: "10px 12px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--lime) 24%, transparent)", background: "color-mix(in srgb, var(--lime) 6%, transparent)", color: "var(--text)" }}>
      <div className="ta-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--lime)", letterSpacing: ".08em", textTransform: "uppercase" }}>
        Incluye extras opcionales
      </div>
      <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4, lineHeight: 1.45 }}>
        {extraBlockCount > 0 ? `${extraBlockCount} bloque${extraBlockCount > 1 ? "s" : ""}` : null}
        {extraBlockCount > 0 && extraGroupCount > 0 ? " · " : null}
        {extraGroupCount > 0 ? `${extraGroupCount} grupo${extraGroupCount > 1 ? "s" : ""}` : null}
        {" · "}No cuentan para completar el entrenamiento, pero podés sumarlos si te sentís con energía.
      </div>
    </div>
  );
}
