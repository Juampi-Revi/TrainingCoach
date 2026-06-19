"use client";

import { Icon } from "@/components/ui";

interface ScoreCardProps {
  weekNumber: number;
  totalWeeks: number;
  weekScore: number;
  previousWeekScore: number | null;
  pills: Array<{ label: string; ok: boolean }>;
}

export function ScoreCard({
  weekNumber,
  totalWeeks,
  weekScore,
  previousWeekScore,
  pills,
}: ScoreCardProps) {
  const trend = previousWeekScore !== null ? weekScore - previousWeekScore : null;
  const scoreColor = weekScore >= 80 ? "var(--lime)" : weekScore >= 50 ? "var(--warn)" : "var(--danger)";

  return (
    <div className="panel-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Score Semanal
          </div>
          <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
            Semana {weekNumber} de {totalWeeks}
            {trend !== null && (
              <span style={{ color: trend >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700, marginLeft: 4 }}>
                {trend >= 0 ? "+" : ""}{trend} vs anterior
              </span>
            )}
          </div>
        </div>
        <div>
          <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{weekScore}</span>
          <span style={{ fontSize: 14, color: "var(--text-mute)" }}>/100</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 8, lineHeight: 1.5 }}>
        Basado en: pasos, sueño, comida y entrenos. Tu score sube cuando cumplís las metas diarias.
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {pills.map((pill) => (
          <div
            key={pill.label}
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
              background: pill.ok ? "rgba(215,255,58,.08)" : "rgba(255,71,87,.08)",
              color: pill.ok ? "var(--lime)" : "var(--danger)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name={pill.ok ? "check" : "x"} size={10} color={pill.ok ? "var(--lime)" : "var(--danger)"} />
            {pill.label}
          </div>
        ))}
      </div>
    </div>
  );
}
