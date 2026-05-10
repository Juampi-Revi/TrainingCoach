"use client";

import { Icon } from "@/components/ui";

interface WeekHeatmapProps {
  weekStart: string;
  dailySteps: (number | null)[];
  dailySleepMinutes: (number | null)[];
  dailyWorkouts: number[];
  goals?: {
    steps?: number | null;
    sleepMinutes?: number | null;
  };
  onDayClick?: (dayIndex: number) => void;
}

const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

export function WeekHeatmap({
  weekStart,
  dailySteps,
  dailySleepMinutes,
  dailyWorkouts,
  goals,
  onDayClick,
}: WeekHeatmapProps) {
  const stepsGoal = goals?.steps ?? 6000;
  const sleepGoal = goals?.sleepMinutes ?? 420;

  function getStepsColor(value: number | null): string {
    if (value === null) return "var(--bg-3)";
    if (value >= stepsGoal) return "var(--lime)";
    if (value >= stepsGoal * 0.5) return "var(--warn)";
    return "var(--danger)";
  }

  function getSleepColor(value: number | null): string {
    if (value === null) return "var(--bg-3)";
    if (value >= sleepGoal) return "var(--lime)";
    if (value >= sleepGoal * 0.5) return "var(--warn)";
    return "var(--danger)";
  }

  function getWorkoutColor(value: number): string {
    if (value > 0) return "var(--lime)";
    return "var(--bg-3)";
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <div className="heatmap-title">
          <Icon name="calendar" size={16} color="var(--text-mute)" />
          Semana en curso
        </div>
      </div>

      <div className="heatmap-grid">
        {/* Header row with day names */}
        <div className="heatmap-row">
          <div className="heatmap-label-cell" />
          {DAYS.map((day, i) => (
            <div key={day} className="heatmap-day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Steps row */}
        <div className="heatmap-row">
          <div className="heatmap-label-cell">
            <Icon name="footprints" size={16} color="var(--text-mute)" />
            <span className="heatmap-label-text">Pasos</span>
          </div>
          {dailySteps.map((value, i) => (
            <button
              key={`steps-${i}`}
              className="heatmap-cell"
              style={{ backgroundColor: getStepsColor(value) }}
              onClick={() => onDayClick?.(i)}
              title={value !== null ? `${value.toLocaleString()} pasos` : "Sin datos"}
            />
          ))}
        </div>

        {/* Sleep row */}
        <div className="heatmap-row">
          <div className="heatmap-label-cell">
            <Icon name="moon" size={16} color="var(--text-mute)" />
            <span className="heatmap-label-text">Sueño</span>
          </div>
          {dailySleepMinutes.map((value, i) => (
            <button
              key={`sleep-${i}`}
              className="heatmap-cell"
              style={{ backgroundColor: getSleepColor(value) }}
              onClick={() => onDayClick?.(i)}
              title={value !== null ? `${Math.floor(value / 60)}h ${value % 60}m` : "Sin datos"}
            />
          ))}
        </div>

        {/* Workouts row */}
        <div className="heatmap-row">
          <div className="heatmap-label-cell">
            <Icon name="dumbbell" size={16} color="var(--text-mute)" />
            <span className="heatmap-label-text">Entreno</span>
          </div>
          {dailyWorkouts.map((value, i) => (
            <button
              key={`workout-${i}`}
              className="heatmap-cell"
              style={{ backgroundColor: getWorkoutColor(value) }}
              onClick={() => onDayClick?.(i)}
              title={value > 0 ? `${value} entrenamiento${value > 1 ? "s" : ""}` : "Sin entrenamiento"}
            />
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: "var(--lime)" }} />
          <span>Meta cumplida</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: "var(--warn)" }} />
          <span>&gt;50%</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: "var(--danger)" }} />
          <span>&lt;50%</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: "var(--bg-3)" }} />
          <span>Sin datos</span>
        </div>
      </div>

      <style jsx>{`
        .heatmap-container {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .heatmap-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .heatmap-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .heatmap-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .heatmap-row {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          gap: 6px;
          align-items: center;
        }

        .heatmap-label-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-mute);
          font-weight: 500;
        }

        .heatmap-label-text {
          display: none;
        }

        .heatmap-day-header {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 600;
          padding: 4px 0;
        }

        .heatmap-cell {
          aspect-ratio: 1;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 24px;
        }

        .heatmap-cell:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .heatmap-legend {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-mute);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }

        @media (min-width: 768px) {
          .heatmap-container {
            padding: 16px;
            border-radius: 14px;
          }

          .heatmap-header {
            margin-bottom: 10px;
          }

          .heatmap-title {
            font-size: 9px;
            letter-spacing: 0.1em;
          }

          .heatmap-grid {
            gap: 4px;
          }

          .heatmap-row {
            grid-template-columns: 80px repeat(7, 1fr);
            gap: 4px;
          }

          .heatmap-label-cell {
            font-size: 12px;
            gap: 8px;
            justify-content: flex-start;
          }

          .heatmap-label-text {
            display: inline;
          }

          .heatmap-label-cell :global(svg) {
            width: 16px;
            height: 16px;
          }

          .heatmap-day-header {
            font-size: 11px;
            padding: 6px 0;
          }

          .heatmap-cell {
            border-radius: 4px;
            min-height: 28px;
          }

          .heatmap-legend {
            margin-top: 14px;
            padding-top: 10px;
            gap: 20px;
          }

          .legend-item {
            font-size: 11px;
          }

          .legend-dot {
            width: 10px;
            height: 10px;
            border-radius: 3px;
          }
        }

        @media (min-width: 1200px) {
          .heatmap-container {
            padding: 20px;
          }

          .heatmap-cell {
            min-height: 32px;
          }
        }
      `}</style>
    </div>
  );
}
