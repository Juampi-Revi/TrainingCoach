"use client";

import { useAuth } from "@/lib/auth";
import { PRsCard } from "./_components/prs-card";
import { MuscleVolumeCard } from "./_components/muscle-volume-card";
import { WeeklyProgressCard } from "./_components/weekly-progress-card";
import { useProgressData } from "./_hooks/use-progress-data";
import "./_styles.css";

export default function ProgresoPage() {
  const { data, loading, error } = useProgressData();

  if (loading) {
    return (
      <div className="progreso-page">
        <div className="progreso-loading">
          <span style={{ color: "var(--text-mute)" }}>Cargando progreso…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progreso-page">
        <div className="progreso-error">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="progreso-page">
        <div className="progreso-empty">Sin datos de progreso</div>
      </div>
    );
  }

  return (
    <div className="progreso-page">
      <div className="progreso-header">
        <h1 className="progreso-title">Mi Progreso</h1>
        <p className="progreso-subtitle">Seguimiento de tu desarrollo</p>
      </div>

      <div className="progreso-section">
        <div className="progreso-grid">
          <PRsCard prs={data.recentPRs} />
          <MuscleVolumeCard muscles={data.muscleVolume} />
          <WeeklyProgressCard weeks={data.weeklyProgress} />
        </div>

        {data.comparisonVsLastWeek && (
          <div className="progreso-comparison">
            <span className="comparison-label">vs semana anterior:</span>
            <span className={`comparison-delta ${data.comparisonVsLastWeek.workoutsDelta >= 0 ? "positive" : "negative"}`}>
              {data.comparisonVsLastWeek.workoutsDelta >= 0 ? "+" : ""}{data.comparisonVsLastWeek.workoutsDelta} entrenos
            </span>
            <span className="comparison-sep">·</span>
            <span className={`comparison-delta ${data.comparisonVsLastWeek.volumeDelta >= 0 ? "positive" : "negative"}`}>
              {data.comparisonVsLastWeek.volumeDelta >= 0 ? "+" : ""}{data.comparisonVsLastWeek.volumeDelta}kg
            </span>
            <span className="comparison-sep">·</span>
            <span className={`comparison-delta ${data.comparisonVsLastWeek.prsDelta >= 0 ? "positive" : "negative"}`}>
              {data.comparisonVsLastWeek.prsDelta >= 0 ? "+" : ""}{data.comparisonVsLastWeek.prsDelta} PRs
            </span>
          </div>
        )}
      </div>
    </div>
  );
}