"use client";

// components/energy-bars.tsx — Barras diarias de energía (L-M-M-J-V-S-D)

interface EnergyBarsProps {
  data: (number | null)[]; // valores 1-5, array de 7 días
}

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function EnergyBars({ data }: EnergyBarsProps) {
  return (
    <div style={{ display: "flex", gap: 4, height: 32, alignItems: "flex-end" }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{
                  height: 3,
                  borderRadius: 1,
                  background: v !== null && n <= v ? "var(--lime)" : "var(--bg-3)",
                  transition: "background .3s ease",
                }}
              />
            ))}
          </div>
          <span
            className="ta-mono"
            style={{ fontSize: 8, color: "var(--text-dim)", fontWeight: 700 }}
          >
            {DAYS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}