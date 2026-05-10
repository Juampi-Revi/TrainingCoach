"use client";

import type { ProgressDashboard } from "@regen/types";
import { Card, Icon, StateBlock } from "@/components/ui";

function trendNode(delta: number, label: string) {
  if (delta === 0) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-mute)" }}>
        <Icon name="minus" size={16} />
        {label}
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: up ? "var(--success)" : "var(--danger)" }}>
      <Icon name={up ? "trendingUp" : "trendingDown"} size={16} />
      {up ? "+" : ""}{delta} {label}
    </span>
  );
}

function metricRow(label: string, value: string, delta: number, deltaLabel: string) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 14,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
          {label}
        </div>
        <div className="ta-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 6 }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 12, flexShrink: 0 }}>{trendNode(delta, deltaLabel)}</div>
    </div>
  );
}

interface ProgressTabProps {
  progress: ProgressDashboard | null;
  loading: boolean;
}

export function ProgressTab({ progress, loading }: ProgressTabProps) {
  if (loading || !progress) {
    return <StateBlock kind="loading" title="Cargando progreso…" />;
  }

  const last = progress.weeklyProgress[progress.weeklyProgress.length - 1];
  const workouts = last?.totalWorkouts ?? 0;
  const volume = last?.totalVolume ?? 0;
  const prs = last?.prsCount ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card pad={16}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>¿Está progresando?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {metricRow("Entrenos", `${workouts}`, progress.comparisonVsLastWeek.workoutsDelta, "vs sem anterior")}
          {metricRow("Volumen", `${volume}`, progress.comparisonVsLastWeek.volumeDelta, "vs sem anterior")}
          {metricRow("PRs", `${prs}`, progress.comparisonVsLastWeek.prsDelta, "vs sem anterior")}
        </div>
      </Card>

      <Card pad={16}>
        <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
          PRs recientes
        </div>
        {progress.recentPRs.length === 0 ? (
          <div style={{ marginTop: 10, color: "var(--text-mute)", fontSize: 13 }}>Sin PRs recientes</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {progress.recentPRs.slice(0, 8).map((pr) => (
              <div
                key={pr.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Icon name="star" size={16} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pr.exerciseName}
                  </div>
                </div>
                <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)", flexShrink: 0 }}>
                  {pr.weight}×{pr.reps}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
