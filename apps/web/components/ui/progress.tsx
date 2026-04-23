import type { CSSProperties } from "react";

interface ProgressProps {
  value?: number;
  total?: number;
  height?: number;
  color?: string;
  style?: CSSProperties;
}

export function Progress({ value = 0, total = 100, height = 6, color = "var(--lime)", style }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / total) * 100));
  return (
    <div style={{ height, background: "var(--bg-3)", borderRadius: 999, overflow: "hidden", ...style }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width .2s",
        }}
      />
    </div>
  );
}
