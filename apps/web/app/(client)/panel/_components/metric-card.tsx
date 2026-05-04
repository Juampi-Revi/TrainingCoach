"use client";

// components/metric-card.tsx — Card de métrica base reutilizable

import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent?: string;
  children?: ReactNode;
}

export function MetricCard({
  label,
  value,
  sub,
  trend,
  accent = "var(--lime)",
  children,
}: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-info">
          <div className="metric-label">{label}</div>
          <div className="metric-value-row">
            <span className="metric-value" style={{ color: accent }}>
              {value}
            </span>
            {trend && <span className="metric-trend">{trend}</span>}
          </div>
          {sub && <div className="metric-sub">{sub}</div>}
        </div>
      </div>
      {children && <div className="metric-content">{children}</div>}

      <style jsx>{`
        .metric-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 0;
          height: 100%;
        }

        .metric-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .metric-info {
          min-width: 0;
        }

        .metric-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }

        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }

        .metric-value {
          font-family: var(--font-mono);
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .metric-trend {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--success);
          font-weight: 700;
        }

        .metric-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
          margin-top: 3px;
        }

        .metric-content {
          margin-top: 6px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .metric-card {
            padding: 24px;
            border-radius: 18px;
            gap: 16px;
          }

          .metric-label {
            font-size: 11px;
            letter-spacing: 0.12em;
            margin-bottom: 10px;
          }

          .metric-value {
            font-size: 32px;
          }

          .metric-trend {
            font-size: 12px;
          }

          .metric-sub {
            font-size: 13px;
            margin-top: 6px;
          }

          .metric-content {
            margin-top: 12px;
          }
        }

        /* Large desktop */
        @media (min-width: 1200px) {
          .metric-card {
            padding: 28px;
          }

          .metric-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}