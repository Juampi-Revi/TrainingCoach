"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import "./_styles.css";

interface Goal {
  id: string;
  kind: "steps" | "sleep" | "workouts";
  targetInt: number | null;
  targetNumber: string | null;
  unit: string;
  period: "daily" | "weekly";
  startDate: string;
  endDate: string | null;
  shareWithCoach: boolean;
  createdAt: string;
}

interface GoalsData {
  goals: Goal[];
  hasCoach: boolean;
}

const GOAL_CONFIGS = {
  steps: {
    icon: "footprints" as const,
    label: "Pasos diarios",
    description: "Meta de pasos por día",
    unit: "pasos",
    defaultValue: 6000,
    min: 1000,
    max: 50000,
    step: 500,
  },
  sleep: {
    icon: "moon" as const,
    label: "Horas de sueño",
    description: "Meta de descanso diario",
    unit: "horas",
    defaultValue: 7,
    min: 4,
    max: 12,
    step: 0.5,
  },
  workouts: {
    icon: "dumbbell" as const,
    label: "Entrenos semanales",
    description: "Mínimo de sesiones por semana",
    unit: "sesiones",
    defaultValue: 3,
    min: 1,
    max: 7,
    step: 1,
  },
};

export default function MetasPage() {
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  const api = createClient(token);
  const [data, setData] = useState<GoalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedKind, setExpandedKind] = useState<keyof typeof GOAL_CONFIGS | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [updatingShare, setUpdatingShare] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const goalsData = await api.get<GoalsData>("/client/goals");
      setData(goalsData);
    } catch (error) {
      toast.error("Error al cargar metas");
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadGoals();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadGoals]);

  function getGoalByKind(kind: keyof typeof GOAL_CONFIGS): Goal | undefined {
    return data?.goals.find((g) => g.kind === kind);
  }

  async function handleCreateGoal(kind: keyof typeof GOAL_CONFIGS, value: number) {
    const config = GOAL_CONFIGS[kind];
    try {
      const payload = {
        kind,
        targetInt: kind === "sleep" ? null : Math.trunc(value),
        targetNumber: kind === "sleep" ? String(value) : null,
        unit: kind === "steps" ? "steps" : kind === "sleep" ? "hours" : "sessions",
        period: kind === "workouts" ? "weekly" : "daily",
        startDate: new Date().toISOString().split("T")[0],
        shareWithCoach: true,
      };

      await api.post<Goal>("/client/goals", payload);
      toast.success(`${config.label} configurada`);
      setExpandedKind(null);
      loadGoals();
    } catch (error) {
      toast.error("Error al crear meta");
    }
  }

  async function handleUpdateGoal(goalId: string, newValue: number) {
    const goal = data?.goals.find((g) => g.id === goalId);
    if (!goal) return;

    try {
      const payload: Record<string, unknown> = {};
      if (goal.kind === "sleep") {
        payload.targetNumber = String(newValue);
      } else {
        payload.targetInt = Math.trunc(newValue);
      }

      await api.patch<Goal>(`/client/goals/${goalId}`, payload);
      toast.success("Meta actualizada");
      setExpandedKind(null);
      loadGoals();
    } catch (error) {
      toast.error("Error al actualizar meta");
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      await api.del(`/client/goals/${goalId}`);
      toast.success("Meta eliminada");
      setExpandedKind(null);
      loadGoals();
    } catch (error) {
      toast.error("Error al eliminar meta");
    }
  }

  async function toggleShareWithCoach() {
    if (!data || updatingShare) return;

    const newValue = !data.goals.some((g) => g.shareWithCoach);

    try {
      setUpdatingShare(true);
      await api.patch("/client/goals", { shareWithCoach: newValue });
      toast.success(newValue ? "Compartiendo con tu entrenador" : "Dejaste de compartir metas");
      setData(prev => prev ? { ...prev, goals: prev.goals.map(g => ({ ...g, shareWithCoach: newValue })) } : null);
    } catch (error) {
      toast.error("Error al actualizar configuración");
    } finally {
      setUpdatingShare(false);
    }
  }

  function openEditor(kind: keyof typeof GOAL_CONFIGS) {
    setExpandedKind((prev) => (prev === kind ? null : kind));
    const goal = getGoalByKind(kind);
    const config = GOAL_CONFIGS[kind];
    const value = goal
      ? goal.kind === "sleep"
        ? goal.targetNumber ?? String(config.defaultValue)
        : goal.targetInt?.toString() ?? String(config.defaultValue)
      : String(config.defaultValue);
    setEditValue(value);
  }

  function closeEditor() {
    setExpandedKind(null);
    setEditValue("");
  }

  async function saveKind(kind: keyof typeof GOAL_CONFIGS) {
    const config = GOAL_CONFIGS[kind];
    const numValue = parseFloat(editValue);
    if (Number.isNaN(numValue)) {
      toast.error("Valor inválido");
      return;
    }

    if (numValue < config.min || numValue > config.max) {
      toast.error(`El valor debe estar entre ${config.min} y ${config.max}`);
      return;
    }

    const goal = getGoalByKind(kind);
    if (goal) {
      await handleUpdateGoal(goal.id, numValue);
      return;
    }
    await handleCreateGoal(kind, numValue);
  }

  const hasGoals = data && data.goals.length > 0;
  const anyShared = data?.goals.some((g) => g.shareWithCoach) ?? false;

  if (loading) {
    return (
      <div className="metas-page">
        <div className="metas-header">
          <button onClick={() => router.back()} className="back-button">
            <Icon name="chevL" size={16} color="var(--text-mute)" />
            Volver
          </button>
          <div className="metas-title">Metas de salud</div>
          <div className="metas-subtitle">Define tus objetivos de pasos, sueño y entrenamientos</div>
        </div>

        <div className="metas-content">
          <div className="metas-skeleton">
            <div className="skeleton-block skeleton-sm" />
            <div className="skeleton-block skeleton-sm skeleton-delay-1" />
            <div className="skeleton-block skeleton-sm skeleton-delay-2" />
            <div className="skeleton-block skeleton-sm skeleton-delay-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metas-page">
      <div className="metas-header">
        <button onClick={() => router.back()} className="back-button">
          <Icon name="chevL" size={16} color="var(--text-mute)" />
          Volver
        </button>
        <div className="metas-title">Metas de salud</div>
        <div className="metas-subtitle">Define tus objetivos de pasos, sueño y entrenamientos</div>
      </div>

      <div className="metas-content">
        <div className="card-cuenta">
          {data?.hasCoach && (
            <div className="card-cuenta-row is-disabled">
              <div className="card-cuenta-left">
                <Icon name={anyShared ? "eye" : "eyeOff"} size={20} color="var(--lime)" />
                <span>Compartir con entrenador</span>
              </div>
              <div className="card-cuenta-right">
                <button
                  onClick={toggleShareWithCoach}
                  disabled={!hasGoals || updatingShare}
                  className={`share-toggle ${anyShared ? "active" : ""}`}
                  aria-label="Compartir con entrenador"
                >
                  <div className="share-toggle-knob" />
                </button>
              </div>
            </div>
          )}

          {(Object.keys(GOAL_CONFIGS) as Array<keyof typeof GOAL_CONFIGS>).map((kind) => {
            const config = GOAL_CONFIGS[kind];
            const goal = getGoalByKind(kind);
            const expanded = expandedKind === kind;
            const displayValue = goal
              ? goal.kind === "sleep"
                ? goal.targetNumber ?? ""
                : goal.targetInt?.toString() ?? ""
              : "Sin configurar";

            return (
              <Fragment key={kind}>
                <div className="card-cuenta-row" onClick={() => openEditor(kind)}>
                  <div className="card-cuenta-left">
                    <Icon name={config.icon} size={20} color="var(--lime)" />
                    <span>{config.label}</span>
                  </div>
                  <div className="card-cuenta-right">
                    <div className="card-cuenta-value">
                      {goal ? `${displayValue} ${config.unit}` : displayValue}
                    </div>
                    <Icon name={expanded ? "chevUp" : "chevD"} size={18} color="var(--text-dim)" />
                  </div>
                </div>

                {expanded && (
                  <div className="card-editor">
                    <div className="editor-row">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveKind(kind);
                          if (e.key === "Escape") closeEditor();
                        }}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        autoFocus
                        className="goal-input"
                      />
                      <div className="goal-unit">{config.unit}</div>
                    </div>

                    <div className="editor-actions">
                      {goal && (
                        <button
                          className="danger-btn"
                          onClick={() => handleDeleteGoal(goal.id)}
                          type="button"
                        >
                          Eliminar
                        </button>
                      )}
                      <div className="spacer" />
                      <button className="ghost-btn" onClick={closeEditor} type="button">
                        Cancelar
                      </button>
                      <button className="primary-btn" onClick={() => saveKind(kind)} type="button">
                        Guardar
                      </button>
                    </div>

                    <div className="editor-help">{config.description}</div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
