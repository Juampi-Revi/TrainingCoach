"use client";

import { Icon } from "@/components/ui/icon";
import type { WeeklyProgressSummary } from "@regen/types";

interface Props {
  weeks: WeeklyProgressSummary[];
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className="delta-badge"
      style={{ color: positive ? "var(--success)" : "var(--danger)", background: positive ? "rgba(110,231,168,0.15)" : "rgba(255,91,91,0.15)" }}
    >
      {positive ? "+" : ""}{delta}
    </span>
  );
}

export function WeeklyProgressCard({ weeks }: Props) {
  const current = weeks[weeks.length - 1];
  const previous = weeks[weeks.length - 2];

  return (
    <div className="progress-card">
      <div className="progress-card-header">
        <Icon name="chart" size={18} color="var(--lime)" />
        <span className="progress-card-title">Resumen Semanal</span>
      </div>
      {weeks.length === 0 ? (
        <div className="progress-empty">Sin datos semanales aún</div>
      ) : (
        <div className="weekly-grid">
          {weeks.map((w, i) => {
            const isCurrent = i === weeks.length - 1;
            return (
              <div key={w.weekNumber} className={`weekly-item ${isCurrent ? "weekly-current" : ""}`}>
                <div className="weekly-header">
                  <span className="weekly-label">Sem {w.weekNumber}</span>
                  {isCurrent && previous && (
                    <DeltaBadge delta={w.totalWorkouts - previous.totalWorkouts} />
                  )}
                </div>
                <div className="weekly-stats">
                  <div className="weekly-stat">
                    <span className="weekly-value">{w.totalWorkouts}</span>
                    <span className="weekly-sub">entrenos</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{w.totalSets}</span>
                    <span className="weekly-sub">series</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{w.prsCount}</span>
                    <span className="weekly-sub">PRs</span>
                  </div>
                </div>
                <div className="weekly-volume">
                  <span className="volume-value">{w.totalVolume.toLocaleString("es-AR")}</span>
                  <span className="volume-unit">kg total</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}