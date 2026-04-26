import type { ReactNode, CSSProperties } from "react";

export interface ColDef {
  key: string;
  label: string;
  w?: string;
  mono?: boolean;
  mute?: boolean;
  align?: "left" | "center" | "right";
}

interface TableProps {
  cols: ColDef[];
  rows: Array<Record<string, ReactNode>>;
  onRowClick?: (index: number) => void;
  style?: CSSProperties;
}

export function Table({ cols, rows, onRowClick, style }: TableProps) {
  const template = cols.map((c) => c.w ?? "1fr").join(" ");

  return (
    <div style={{ overflowX: "auto", borderRadius: 12, ...style }}>
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
        minWidth: 480,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: template,
          padding: "10px 16px",
          background: "var(--bg-2)",
          borderBottom: "1px solid var(--line)",
          gap: 12,
        }}
      >
        {cols.map((c) => (
          <div
            key={c.key}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-mute)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              textAlign: c.align ?? "left",
              fontFamily: c.mono ? "var(--font-mono)" : undefined,
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {rows.map((row, ri) => (
        <div
          key={ri}
          onClick={() => onRowClick?.(ri)}
          className={onRowClick ? "ta-row" : undefined}
          style={{
            display: "grid",
            gridTemplateColumns: template,
            padding: "12px 16px",
            borderBottom: ri < rows.length - 1 ? "1px solid var(--line)" : "none",
            gap: 12,
            alignItems: "center",
            cursor: onRowClick ? "pointer" : undefined,
          }}
        >
          {cols.map((c) => (
            <div
              key={c.key}
              style={{
                fontSize: 13,
                fontFamily: c.mono ? "var(--font-mono)" : undefined,
                color: c.mute ? "var(--text-mute)" : "var(--text)",
                textAlign: c.align ?? "left",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              {row[c.key]}
            </div>
          ))}
        </div>
      ))}

      {rows.length === 0 && (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-mute)",
          }}
        >
          Sin datos
        </div>
      )}
    </div>
    </div>
  );
}
