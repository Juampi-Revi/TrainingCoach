"use client";

const ENERGY_LABELS: Record<number, string> = {
  1: "BAJA",
  2: "BAJA+",
  3: "MEDIA",
  4: "ALTA-",
  5: "ALTA",
};

export function CompletadaEnergyCard({
  energy,
  onChange,
}: {
  energy: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>¿CÓMO TE SENTISTE?</div>
      <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4, marginBottom: 10 }}>Energía durante el entrenamiento</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const sel = energy === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              style={{
                flex: 1, height: 56, borderRadius: 9,
                background: sel ? "var(--lime)" : "var(--bg-2)",
                border: `1px solid ${sel ? "var(--lime)" : "var(--line-2)"}`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                cursor: "pointer", color: sel ? "var(--bg)" : "var(--text-mute)",
              }}
            >
              <span className="ta-mono" style={{ fontSize: 16, fontWeight: 700 }}>{n}</span>
              {ENERGY_LABELS[n] && (
                <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".05em" }}>{ENERGY_LABELS[n]}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CompletadaHighlights({
  highlights,
}: {
  highlights: Array<{ name: string; weight: number; reps: number }>;
}) {
  if (highlights.length === 0) return null;
  return (
    <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>DESTACADOS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {highlights.map((h, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 10px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{h.name}</div>
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                {h.weight} kg × {h.reps} reps
              </div>
            </div>
            <div style={{
              padding: "3px 8px", borderRadius: 5,
              background: "color-mix(in srgb, var(--lime) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--lime) 25%, transparent)",
              fontSize: 10, fontWeight: 700, color: "var(--lime)", fontFamily: "var(--font-mono)",
            }}>
              TOP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompletadaStatCard({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div style={{
      background: "var(--bg-1)",
      border: `1px solid ${accent ? "var(--lime)" : "var(--line)"}`,
      borderRadius: 10, padding: "10px 8px",
    }}>
      <div className="ta-mono" style={{ fontSize: 8, color: accent ? "var(--lime)" : "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 4 }}>
        <span className="ta-mono" style={{ fontSize: 20, fontWeight: 700, color: accent ? "var(--lime)" : "var(--text)", letterSpacing: "-.02em" }}>{value}</span>
        {unit && <span className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>{unit}</span>}
      </div>
    </div>
  );
}
