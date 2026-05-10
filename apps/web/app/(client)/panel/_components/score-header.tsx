"use client";

import { DailySummary } from "./daily-summary";

interface ScoreHeaderProps {
  weekNumber: number;
  totalWeeks: number;
  weekScore: number;
  previousWeekScore: number | null;
  workoutsWeeklyTarget: number | null;
  today: {
    date: string;
    steps: number | null;
    sleepMinutes: number | null;
    workoutsToday: number;
    food: Array<{ quality: string | null }>;
  };
  goals: Array<{ kind: string; targetInt: number | null }>;
}

export function ScoreHeader({
  weekNumber,
  totalWeeks,
  weekScore,
  previousWeekScore,
  workoutsWeeklyTarget,
  today,
  goals,
}: ScoreHeaderProps) {
  const trend = previousWeekScore !== null ? weekScore - previousWeekScore : null;
  const scoreColor = weekScore >= 80 ? "var(--lime)" : weekScore >= 50 ? "var(--warn)" : "var(--danger)";

  return (
    <div className="score-card">
      <DailySummary today={today} goals={goals} workoutsWeeklyTarget={workoutsWeeklyTarget} />

      <div className="week-summary">
        <div className="week-summary-row">
          <div className="week-summary-label">SCORE SEMANAL</div>
          <div className="week-summary-score">
            <span className="week-summary-number" style={{ color: scoreColor }}>
              {weekScore}
            </span>
            <span className="week-summary-total">/100</span>
          </div>
        </div>
        <div className="week-summary-meta">
          Semana {weekNumber} de {totalWeeks}
          {trend !== null && (
            <span
              className="week-summary-trend"
              style={{ color: trend >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {trend >= 0 ? " · +" : " · "}
              {trend} vs anterior
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
