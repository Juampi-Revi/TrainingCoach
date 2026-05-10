"use client";

interface MetricEntryLike {
  measuredAt: string;
  weightKg: string | null;
}

export function WeightChart({ metrics }: { metrics: MetricEntryLike[] }) {
  const weightData = metrics
    .filter((m) => m.weightKg)
    .map((m) => ({ date: new Date(m.measuredAt), weight: parseFloat(m.weightKg!) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (weightData.length < 2) return null;

  const weights = weightData.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const padding = { top: 18, right: 14, bottom: 22, left: 34 };
  const width = 320;
  const height = 120;

  const points = weightData
    .map((d, i) => {
      const x = padding.left + (i / (weightData.length - 1)) * (width - padding.left - padding.right);
      const y = padding.top + (1 - (d.weight - min) / range) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "auto", display: "block", marginTop: 10, maxHeight: 140 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {[0, 0.5, 1].map((pct, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={padding.top + pct * (height - padding.top - padding.bottom)}
          x2={width - padding.right}
          y2={padding.top + pct * (height - padding.top - padding.bottom)}
          stroke="var(--line)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      ))}

      {[0, 1].map((pct, i) => (
        <text
          key={i}
          x={padding.left - 5}
          y={padding.top + pct * (height - padding.top - padding.bottom) + 3}
          textAnchor="end"
          fontSize="10"
          fill="var(--text-mute)"
        >
          {(max - pct * range).toFixed(1)}
        </text>
      ))}

      <polyline
        points={points}
        fill="none"
        stroke="var(--lime)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {weightData.map((d, i) => {
        const x = padding.left + (i / (weightData.length - 1)) * (width - padding.left - padding.right);
        const y = padding.top + (1 - (d.weight - min) / range) * (height - padding.top - padding.bottom);
        const isLast = i === weightData.length - 1;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={isLast ? 6 : 4}
              fill={isLast ? "var(--lime)" : "var(--bg-1)"}
              stroke="var(--lime)"
              strokeWidth="2"
            />
            {isLast && (
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--lime)"
                fontWeight="bold"
              >
                {d.weight.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      <text x={padding.left} y={height - 6} textAnchor="start" fontSize="10" fill="var(--text-mute)">
        {weightData[0].date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
      </text>
      <text x={width - padding.right} y={height - 6} textAnchor="end" fontSize="10" fill="var(--text-mute)">
        {weightData[weightData.length - 1].date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
      </text>
    </svg>
  );
}
