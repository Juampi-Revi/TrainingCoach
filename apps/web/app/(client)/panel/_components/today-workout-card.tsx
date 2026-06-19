"use client";

import { Icon } from "@/components/ui";

interface TodayWorkoutCardProps {
  workoutsToday: number;
  workoutsTarget: number | null;
  onStart: () => void;
  onView: () => void;
}

export function TodayWorkoutCard({
  workoutsToday,
  workoutsTarget,
  onStart,
  onView,
}: TodayWorkoutCardProps) {
  const hasWorkoutToday = workoutsToday > 0;
  const hasWorkoutsPlanned = (workoutsTarget ?? 0) > 0;

  if (!hasWorkoutsPlanned && !hasWorkoutToday) return null;

  if (hasWorkoutToday) {
    return (
      <div className="panel-card workout-card-done">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(215,255,58,.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="check" size={20} color="var(--lime)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Entreno completado</div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
              {workoutsToday} {workoutsToday === 1 ? "entrenamiento" : "entrenamientos"} hoy
            </div>
          </div>
          <button
            onClick={onView}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            Ver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card workout-card-pending">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(215,255,58,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="dumbbell" size={20} color="var(--lime)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Entreno de hoy</div>
          <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
            Tenés entrenamiento planeado
          </div>
        </div>
        <button
          onClick={onStart}
          style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "var(--lime)", color: "var(--bg-1)", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
        >
          Empezar
        </button>
      </div>
    </div>
  );
}
