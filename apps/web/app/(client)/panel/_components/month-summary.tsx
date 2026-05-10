"use client";

import { Icon } from "@/components/ui";

interface MonthSummaryProps {
  activeDays: number;
  totalDays: number;
  stepsTotal: number;
  sleepAvgMinutes: number;
  workoutsTotal: number;
}

export function MonthSummary({
  activeDays,
  totalDays,
  stepsTotal,
  sleepAvgMinutes,
  workoutsTotal,
}: MonthSummaryProps) {
  const progressPct = Math.round((activeDays / totalDays) * 100);
  const stepsAvg = activeDays > 0 ? Math.round(stepsTotal / activeDays) : 0;
  const sleepHours = Math.floor(sleepAvgMinutes / 60);
  const sleepMins = sleepAvgMinutes % 60;

  return (
    <div className="month-summary-container">
      <div className="month-summary-header">
        <div className="month-summary-title">
          <Icon name="calendar" size={16} color="var(--text-mute)" />
          Resumen del mes
        </div>
      </div>

      <div className="month-progress">
        <div className="month-progress-header">
          <span className="month-progress-label">Días activos</span>
          <span className="month-progress-value">{activeDays}/{totalDays}</span>
        </div>
        <div className="month-progress-bar">
          <div 
            className="month-progress-fill" 
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="month-stats">
        <div className="month-stat">
          <div className="month-stat-icon">
            <Icon name="footprints" size={18} color="var(--lime)" />
          </div>
          <div className="month-stat-content">
            <div className="month-stat-value">{stepsAvg.toLocaleString()}</div>
            <div className="month-stat-label">prom pasos/día</div>
          </div>
        </div>

        <div className="month-stat">
          <div className="month-stat-icon">
            <Icon name="moon" size={18} color="var(--sleep)" />
          </div>
          <div className="month-stat-content">
            <div className="month-stat-value">{sleepHours}h {sleepMins > 0 ? `${sleepMins}m` : ""}</div>
            <div className="month-stat-label">prom sueño</div>
          </div>
        </div>

        <div className="month-stat">
          <div className="month-stat-icon">
            <Icon name="dumbbell" size={18} color="var(--info)" />
          </div>
          <div className="month-stat-content">
            <div className="month-stat-value">{workoutsTotal}</div>
            <div className="month-stat-label">entrenos</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .month-summary-container {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .month-summary-header {
          margin-bottom: 16px;
        }

        .month-summary-title {
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

        .month-progress {
          margin-bottom: 20px;
        }

        .month-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .month-progress-label {
          font-size: 12px;
          color: var(--text-mute);
        }

        .month-progress-value {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
        }

        .month-progress-bar {
          height: 6px;
          background: var(--bg-2);
          border-radius: 3px;
          overflow: hidden;
        }

        .month-progress-fill {
          height: 100%;
          background: var(--lime);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .month-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .month-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: var(--bg);
          border-radius: 10px;
          border: 1px solid var(--line);
        }

        .month-stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .month-stat-content {
          flex: 1;
        }

        .month-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }

        .month-stat-label {
          font-size: 11px;
          color: var(--text-mute);
          margin-top: 2px;
        }

        @media (min-width: 768px) {
          .month-summary-container {
            padding: 20px;
            border-radius: 16px;
          }

          .month-summary-header {
            margin-bottom: 20px;
          }

          .month-summary-title {
            font-size: 10px;
            letter-spacing: 0.12em;
          }

          .month-progress {
            margin-bottom: 24px;
          }

          .month-progress-label {
            font-size: 13px;
          }

          .month-progress-value {
            font-size: 14px;
          }

          .month-progress-bar {
            height: 8px;
            border-radius: 4px;
          }

          .month-progress-fill {
            border-radius: 4px;
          }

          .month-stats {
            gap: 12px;
          }

          .month-stat {
            padding: 12px;
            border-radius: 12px;
          }

          .month-stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }

          .month-stat-icon :global(svg) {
            width: 20px;
            height: 20px;
          }

          .month-stat-value {
            font-size: 18px;
          }

          .month-stat-label {
            font-size: 12px;
          }
        }

        @media (min-width: 1200px) {
          .month-summary-container {
            padding: 24px;
          }

          .month-stat-icon {
            width: 44px;
            height: 44px;
          }

          .month-stat-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
