import type { CSSProperties } from "react";

interface KPIProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  hint?: string;
  style?: CSSProperties;
}

export function KPI({ label, value, unit, trend, hint, style }: KPIProps) {
  const trendColor =
    trend?.startsWith("+")
      ? "var(--success)"
      : trend?.startsWith("−") || trend?.startsWith("-")
        ? "var(--danger)"
        : "var(--text-mute)";

  return (
    <div
      style={{
        padding: 18,
        border: "1px solid var(--line)",
        borderRadius: 12,
        background: "var(--bg-1)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-mute)",
          textTransform: "uppercase",
          letterSpacing: ".08em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          className="ta-mono"
          style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.03em", color: "var(--text)" }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: "var(--text-mute)" }}>{unit}</span>}
      </div>
      {(trend ?? hint) && (
        <div style={{ fontSize: 12, color: trendColor }}>
          {trend}
          {hint && (
            <span style={{ color: "var(--text-mute)", marginLeft: 6 }}>{hint}</span>
          )}
        </div>
      )}
    </div>
  );
}
