"use client";

// components/score-header.tsx — Header con activity rings y score semanal

import { ActivityRings } from "./activity-rings";

interface ScoreHeaderProps {
  weekNumber: number;
  totalWeeks: number;
  weekScore: number;
  previousWeekScore: number | null;
  workoutFraction: number;
  stepsFraction: number;
  sleepFraction: number;
}

export function ScoreHeader({
  weekNumber,
  totalWeeks,
  weekScore,
  previousWeekScore,
  workoutFraction,
  stepsFraction,
  sleepFraction,
}: ScoreHeaderProps) {
  const trend = previousWeekScore !== null ? weekScore - previousWeekScore : null;
  const scoreColor = weekScore >= 80 ? "var(--lime)" : weekScore >= 50 ? "#FF8E72" : "var(--danger)";

  return (
    <div className="score-header">
      <div className="score-visual">
        <div className="rings-mobile">
          <ActivityRings
            workoutFraction={workoutFraction}
            stepsFraction={stepsFraction}
            sleepFraction={sleepFraction}
            size={76}
          />
        </div>
        <div className="rings-desktop">
          <ActivityRings
            workoutFraction={workoutFraction}
            stepsFraction={stepsFraction}
            sleepFraction={sleepFraction}
            size={110}
          />
        </div>
      </div>

      <div className="score-content">
        <div className="score-label">SCORE SEMANAL</div>
        <div className="score-value-row">
          <span className="score-number" style={{ color: scoreColor }}>
            {weekScore}
          </span>
          <span className="score-total">/100</span>
        </div>
        <div className="score-meta">
          Semana {weekNumber} de {totalWeeks}
          {trend !== null && (
            <span
              className="score-trend"
              style={{ color: trend >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {trend >= 0 ? " · +" : " · "}
              {trend} vs anterior
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .score-header {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px 20px;
        }

        .score-visual {
          flex-shrink: 0;
        }

        .rings-desktop {
          display: none;
        }

        .score-content {
          flex: 1;
          min-width: 0;
        }

        .score-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
          letter-spacing: 0.12em;
          font-weight: 700;
        }

        .score-value-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 4px;
        }

        .score-number {
          font-family: var(--font-mono);
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .score-total {
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--text-mute);
        }

        .score-meta {
          font-size: 12px;
          color: var(--text-mute);
          margin-top: 6px;
          font-weight: 500;
        }

        .score-trend {
          font-weight: 600;
        }

        /* Desktop - Prominente */
        @media (min-width: 768px) {
          .score-header {
            padding: 32px 40px;
            gap: 32px;
            border-radius: 20px;
          }

          .rings-mobile {
            display: none;
          }

          .rings-desktop {
            display: block;
          }

          .score-label {
            font-size: 12px;
            letter-spacing: 0.14em;
          }

          .score-number {
            font-size: 56px;
          }

          .score-total {
            font-size: 20px;
          }

          .score-meta {
            font-size: 14px;
            margin-top: 8px;
          }
        }

        /* Large desktop */
        @media (min-width: 1200px) {
          .score-header {
            padding: 40px 48px;
          }

          .score-number {
            font-size: 64px;
          }
        }
      `}</style>
    </div>
  );
}