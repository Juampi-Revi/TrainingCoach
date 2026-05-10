"use client";

import { Icon } from "@/components/ui/icon";
import type { PersonalRecord } from "@regen/types";

interface Props {
  prs: PersonalRecord[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function PRsCard({ prs }: Props) {
  return (
    <div className="progress-card">
      <div className="progress-card-header">
        <Icon name="trophy" size={18} color="var(--lime)" />
        <span className="progress-card-title">Récords Personales</span>
      </div>
      {prs.length === 0 ? (
        <div className="progress-empty">No hay récords aún. ¡Entrená fuerte!</div>
      ) : (
        <div className="prs-list">
          {prs.map(pr => (
            <div key={pr.id} className="pr-item">
              <div className="pr-info">
                <span className="pr-exercise">{pr.exerciseName}</span>
                <span className="pr-date">{formatDate(pr.achievedAt)}</span>
              </div>
              <div className="pr-stats">
                <span className="pr-weight">{pr.weight}kg</span>
                <span className="pr-reps">× {pr.reps}</span>
                <span className="pr-1rm">{pr.estimated1rm.toFixed(1)} e1RM</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}