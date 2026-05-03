import type { ReactNode } from "react";

export function SectionLabel({ label, count, accent, right }: { label: string; count: number; accent: string; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "var(--bg-2)", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${accent}` }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</span>
      <span style={{ fontSize: 10, color: "var(--text-dim)" }}>· {count}</span>
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}
