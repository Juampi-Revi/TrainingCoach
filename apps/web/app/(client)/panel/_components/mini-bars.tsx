"use client";

// components/mini-bars.tsx — Mini gráfico de barras para 7 días (pasos)

interface MiniBarsProps {
  data: (number | null)[]; // valores (ej: pasos en miles)
  target?: number;         // línea de meta
  color?: string;
  unit?: string;
}

export function MiniBars({ data, target, color = "var(--lime)", unit = "k" }: MiniBarsProps) {
  const validData = data.filter((v): v is number => v !== null);
  const max = Math.max(...validData, target ?? 0, 1);

  return (
    <div style={{ height: 38, display: "flex", alignItems: "flex-end", gap: 4, position: "relative" }}>
      {/* Target line */}
      {target !== undefined && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(1 - target / max) * 100}%`,
            borderTop: "1px dashed var(--line-2)",
            pointerEvents: "none",
          }}
        />
      )}
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: v !== null ? `${(v / max) * 100}%` : "20%",
            minHeight: 3,
            borderRadius: 1.5,
            background: v !== null && target !== undefined && v >= target ? color : "var(--bg-3)",
            transition: "height .3s ease, background .3s ease",
          }}
          title={v !== null ? `${v}${unit}` : "Sin datos"}
        />
      ))}
    </div>
  );
}