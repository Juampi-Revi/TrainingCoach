"use client";

import { Icon } from "@/components/ui/icon";
import type { MuscleVolumeStats } from "@regen/types";

interface Props {
  muscles: MuscleVolumeStats[];
}

function TrendArrow({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <Icon name="trendingUp" size={14} color="var(--success)" />;
  if (trend === "down") return <Icon name="trendingDown" size={14} color="var(--danger)" />;
  return <Icon name="minus" size={14} color="var(--text-dim)" />;
}

function MuscleBar({ muscle, sets, maxSets }: { muscle: string; sets: number; maxSets: number }) {
  const pct = maxSets > 0 ? (sets / maxSets) * 100 : 0;
  return (
    <div className="muscle-bar-row">
      <span className="muscle-bar-label">{muscle}</span>
      <div className="muscle-bar-track">
        <div className="muscle-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="muscle-bar-sets">{sets}</span>
    </div>
  );
}

export function MuscleVolumeCard({ muscles }: Props) {
  const maxSets = muscles.length > 0 ? Math.max(...muscles.map(m => m.sets)) : 1;

  return (
    <div className="progress-card">
      <div className="progress-card-header">
        <Icon name="dumbbell" size={18} color="var(--lime)" />
        <span className="progress-card-title">Volumen por Músculo (30 días)</span>
      </div>
      {muscles.length === 0 ? (
        <div className="progress-empty">Sin datos de volumen aún</div>
      ) : (
        <div className="muscle-bars">
          {muscles.map(m => (
            <div key={m.muscle} className="muscle-bar-container">
              <MuscleBar muscle={m.muscle} sets={m.sets} maxSets={maxSets} />
              <TrendArrow trend={m.trend} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}