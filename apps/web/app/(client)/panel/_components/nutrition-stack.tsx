"use client";

// components/nutrition-stack.tsx — Barra apilada de nutrición con score /10

interface NutritionStackProps {
  good: number;
  regular: number;
  poor: number;
}

export function NutritionStack({ good, regular, poor }: NutritionStackProps) {
  const total = good + regular + poor;
  const score = total > 0 ? Math.round(((good * 10 + regular * 5) / (total * 10)) * 10) : 0;

  if (total === 0) {
    return (
      <div className="nutrition-empty">
        Sin registros esta semana
      </div>
    );
  }

  return (
    <div className="nutrition-stack">
      <div className="nutrition-score-row">
        <div
          className="nutrition-score"
          style={{
            color: score >= 7 ? "var(--lime)" : score >= 4 ? "#FF8E72" : "var(--danger)",
          }}
        >
          {score}
          <span className="nutrition-score-total">/10</span>
        </div>
        <div className="nutrition-count">{total} comidas registradas</div>
      </div>

      {/* Stacked bar */}
      <div className="nutrition-bar">
        {good > 0 && <div className="nutrition-segment good" style={{ flex: good }} />}
        {regular > 0 && <div className="nutrition-segment regular" style={{ flex: regular }} />}
        {poor > 0 && <div className="nutrition-segment poor" style={{ flex: poor }} />}
      </div>

      {/* Legend */}
      <div className="nutrition-legend">
        <LegendItem color="var(--success)" count={good} label="buenas" />
        <LegendItem color="#FF8E72" count={regular} label="ok" />
        <LegendItem color="var(--danger)" count={poor} label="pobres" />
      </div>

      <style jsx>{`
        .nutrition-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nutrition-empty {
          font-size: 12px;
          color: var(--text-mute);
        }

        .nutrition-score-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 8px;
        }

        .nutrition-score {
          font-family: var(--font-mono);
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .nutrition-score-total {
          font-size: 12px;
          color: var(--text-mute);
        }

        .nutrition-count {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
        }

        .nutrition-bar {
          display: flex;
          gap: 2px;
          border-radius: 4px;
          overflow: hidden;
          height: 8px;
          background: var(--bg-3);
        }

        .nutrition-segment {
          transition: flex 0.4s ease;
          min-width: 4px;
        }

        .nutrition-segment.good {
          background: var(--success);
        }

        .nutrition-segment.regular {
          background: #FF8E72;
        }

        .nutrition-segment.poor {
          background: var(--danger);
        }

        .nutrition-legend {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .nutrition-stack {
            gap: 12px;
          }

          .nutrition-score {
            font-size: 26px;
          }

          .nutrition-score-total {
            font-size: 14px;
          }

          .nutrition-count {
            font-size: 11px;
          }

          .nutrition-bar {
            height: 10px;
            border-radius: 5px;
          }

          .nutrition-legend {
            margin-top: 8px;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

function LegendItem({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div className="legend-item">
      <div className="legend-dot" style={{ background: color }} />
      <span className="legend-text">
        {count} {label}
      </span>

      <style jsx>{`
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 3px;
        }

        .legend-text {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
        }

        /* Desktop */
        @media (min-width: 768px) {
          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 4px;
          }

          .legend-text {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}