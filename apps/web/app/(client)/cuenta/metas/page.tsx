"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";

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
    icon: "footprint" as const,
    label: "Pasos diarios",
    description: "Meta de pasos por día",
    unit: "pasos",
    defaultValue: 10000,
    min: 1000,
    max: 50000,
    step: 500,
  },
  sleep: {
    icon: "moon" as const,
    label: "Horas de sueño",
    description: "Meta de descanso diario",
    unit: "horas",
    defaultValue: 8,
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
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [updatingShare, setUpdatingShare] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoading(true);
      const goalsData = await api.get<GoalsData>("/client/goals");
      setData(goalsData);
    } catch (error) {
      toast.error("Error al cargar metas");
    } finally {
      setLoading(false);
    }
  }

  function getGoalByKind(kind: keyof typeof GOAL_CONFIGS): Goal | undefined {
    return data?.goals.find((g) => g.kind === kind);
  }

  async function handleCreateGoal(kind: keyof typeof GOAL_CONFIGS) {
    const config = GOAL_CONFIGS[kind];
    try {
      const payload = {
        kind,
        targetInt: kind === "sleep" ? null : config.defaultValue,
        targetNumber: kind === "sleep" ? String(config.defaultValue) : null,
        unit: kind === "steps" ? "steps" : kind === "sleep" ? "hours" : "sessions",
        period: kind === "workouts" ? "weekly" : "daily",
        startDate: new Date().toISOString().split("T")[0],
        shareWithCoach: true,
      };

      await api.post<Goal>("/client/goals", payload);
      toast.success(`${config.label} configurada`);
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
      loadGoals();
    } catch (error) {
      toast.error("Error al actualizar meta");
    } finally {
      setEditingGoal(null);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      await api.del(`/client/goals/${goalId}`);
      toast.success("Meta eliminada");
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

  function startEditing(goal: Goal) {
    setEditingGoal(goal.id);
    const value = goal.kind === "sleep" && goal.targetNumber
      ? goal.targetNumber
      : goal.targetInt?.toString() || "";
    setEditValue(value);
  }

  function saveEdit(goal: Goal) {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue)) {
      toast.error("Valor inválido");
      return;
    }
    handleUpdateGoal(goal.id, numValue);
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
          <div className="loading-state">
            <Icon name="refresh" size={32} color="var(--text-mute)" />
            <div className="loading-text">Cargando metas...</div>
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
        {data?.hasCoach && (
          <div className="share-section">
            <div className="share-card">
              <div className="share-info">
                <div className="share-icon">
                  <Icon name={anyShared ? "eye" : "eyeOff"} size={20} color="var(--lime)" />
                </div>
                <div className="share-text">
                  <div className="share-title">Compartir con entrenador</div>
                  <div className="share-desc">
                    {anyShared
                      ? "Tu entrenador puede ver tu progreso"
                      : "Las metas son privadas"}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleShareWithCoach}
                disabled={updatingShare}
                className={`share-toggle ${anyShared ? "active" : ""}`}
              >
                <div className="share-toggle-knob" />
              </button>
            </div>
          </div>
        )}

        <div className="goals-grid">
          {(Object.keys(GOAL_CONFIGS) as Array<keyof typeof GOAL_CONFIGS>).map((kind) => {
            const config = GOAL_CONFIGS[kind];
            const goal = getGoalByKind(kind);
            const isEditing = editingGoal === goal?.id;

            return (
              <div key={kind} className={`goal-card ${goal ? "active" : "empty"}`}>
                <div className="goal-header">
                  <div className="goal-icon">
                    <Icon name={config.icon} size={24} color={goal ? "var(--lime)" : "var(--text-mute)"} />
                  </div>
                  {goal && (
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="goal-delete"
                      title="Eliminar meta"
                    >
                      <Icon name="x" size={16} color="var(--text-mute)" />
                    </button>
                  )}
                </div>

                <div className="goal-label">{config.label}</div>

                {goal ? (
                  <>
                    {isEditing ? (
                      <div className="goal-edit">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(goal);
                            if (e.key === "Escape") setEditingGoal(null);
                          }}
                          min={config.min}
                          max={config.max}
                          step={config.step}
                          autoFocus
                          className="goal-input"
                        />
                        <div className="goal-unit">{config.unit}</div>
                        <div className="goal-edit-actions">
                          <button onClick={() => setEditingGoal(null)} className="goal-btn cancel">
                            <Icon name="x" size={14} color="var(--text-mute)" />
                          </button>
                          <button onClick={() => saveEdit(goal)} className="goal-btn save">
                            <Icon name="check" size={14} color="var(--bg)" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="goal-value-section" onClick={() => startEditing(goal)}>
                        <div className="goal-value">
                          {goal.kind === "sleep" && goal.targetNumber
                            ? goal.targetNumber
                            : goal.targetInt}
                        </div>
                        <div className="goal-unit">{config.unit}</div>
                        <div className="goal-edit-hint">
                          <Icon name="edit" size={12} color="var(--text-mute)" />
                        </div>
                      </div>
                    )}
                    <div className="goal-desc">{config.description}</div>
                  </>
                ) : (
                  <>
                    <div className="goal-empty-text">Sin configurar</div>
                    <button
                      onClick={() => handleCreateGoal(kind)}
                      className="goal-setup-btn"
                    >
                      <Icon name="plus" size={16} color="var(--bg)" />
                      Configurar
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {!hasGoals && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="target" size={48} color="var(--text-mute)" />
            </div>
            <div className="empty-title">Configura tus metas</div>
            <div className="empty-desc">
              Define objetivos de pasos, sueño y entrenos para hacer un seguimiento de tu progreso.
              Puedes editar los valores en cualquier momento.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .metas-page {
          min-height: 100dvh;
          background: var(--bg);
          padding-bottom: calc(100px + env(safe-area-inset-bottom));
        }

        .metas-header {
          padding: 20px 16px 16px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-mute);
          font-size: 14px;
          padding: 0;
          margin-bottom: 16px;
          transition: color 0.2s ease;
        }

        .back-button:hover {
          color: var(--text);
        }

        .metas-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .metas-subtitle {
          font-size: 13px;
          color: var(--text-mute);
        }

        .metas-content {
          padding: 0 16px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          gap: 16px;
        }

        .loading-text {
          font-size: 14px;
          color: var(--text-mute);
        }

        .share-section {
          margin-bottom: 16px;
        }

        .share-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
        }

        .share-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .share-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .share-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .share-desc {
          font-size: 12px;
          color: var(--text-mute);
          margin-top: 2px;
        }

        .share-toggle {
          width: 52px;
          height: 28px;
          border-radius: 14px;
          background: var(--bg-2);
          border: 2px solid var(--line);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          padding: 0;
        }

        .share-toggle.active {
          background: var(--lime);
          border-color: var(--lime);
        }

        .share-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .share-toggle-knob {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--text);
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease;
        }

        .share-toggle.active .share-toggle-knob {
          transform: translateX(24px);
          background: var(--bg);
        }

        .goals-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .goal-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .goal-card.empty {
          background: transparent;
          border-style: dashed;
        }

        .goal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .goal-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .goal-card.empty .goal-icon {
          background: var(--bg-1);
        }

        .goal-delete {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .goal-delete:hover {
          background: rgba(255, 91, 91, 0.1);
        }

        .goal-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .goal-value-section {
          display: flex;
          align-items: baseline;
          gap: 8px;
          cursor: pointer;
          padding: 8px 0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .goal-value-section:hover {
          background: var(--bg-2);
          padding: 8px 12px;
          margin: 0 -12px;
        }

        .goal-value {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--lime);
          line-height: 1;
        }

        .goal-unit {
          font-size: 13px;
          color: var(--text-mute);
          font-weight: 500;
        }

        .goal-edit-hint {
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .goal-value-section:hover .goal-edit-hint {
          opacity: 1;
        }

        .goal-edit {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .goal-input {
          width: 100px;
          padding: 10px 14px;
          font-size: 24px;
          font-weight: 700;
          background: var(--bg);
          border: 2px solid var(--lime);
          border-radius: 10px;
          color: var(--text);
          outline: none;
          text-align: center;
        }

        .goal-input::-webkit-outer-spin-button,
        .goal-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .goal-edit-actions {
          display: flex;
          gap: 8px;
        }

        .goal-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .goal-btn.cancel {
          background: var(--bg-2);
        }

        .goal-btn.cancel:hover {
          background: var(--line);
        }

        .goal-btn.save {
          background: var(--lime);
        }

        .goal-btn.save:hover {
          opacity: 0.9;
        }

        .goal-desc {
          font-size: 13px;
          color: var(--text-mute);
        }

        .goal-empty-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-mute);
        }

        .goal-setup-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--lime);
          border: none;
          border-radius: 10px;
          color: var(--bg);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: fit-content;
        }

        .goal-setup-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .empty-state {
          text-align: center;
          padding: 40px 24px;
          margin-top: 24px;
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .empty-desc {
          font-size: 14px;
          color: var(--text-mute);
          max-width: 320px;
          margin: 0 auto;
          line-height: 1.5;
        }

        @media (min-width: 768px) {
          .metas-page {
            padding-bottom: 32px;
          }

          .metas-header {
            padding: 48px 28px 24px;
            border-bottom: 1px solid var(--line);
          }

          .metas-title {
            font-size: 32px;
          }

          .metas-subtitle {
            font-size: 15px;
          }

          .metas-content {
            padding: 0 28px;
            max-width: 900px;
            margin: 0 auto;
          }

          .share-section {
            margin-top: 24px;
            margin-bottom: 24px;
          }

          .share-card {
            padding: 20px 24px;
            border-radius: 16px;
          }

          .share-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }

          .share-title {
            font-size: 16px;
          }

          .share-desc {
            font-size: 14px;
          }

          .goals-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }

          .goal-card {
            padding: 24px;
            border-radius: 16px;
            min-height: 220px;
          }

          .goal-icon {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }

          .goal-label {
            font-size: 10px;
          }

          .goal-value {
            font-size: 40px;
          }

          .goal-unit {
            font-size: 15px;
          }

          .goal-input {
            width: 120px;
            font-size: 28px;
          }

          .empty-state {
            padding: 60px 24px;
          }

          .empty-icon {
            transform: scale(1.2);
          }

          .empty-title {
            font-size: 20px;
          }

          .empty-desc {
            font-size: 15px;
            max-width: 400px;
          }
        }

        @media (min-width: 1200px) {
          .metas-header {
            padding: 48px 48px 24px;
          }

          .metas-content {
            padding: 0 48px;
            max-width: 1100px;
          }

          .goals-grid {
            gap: 20px;
          }

          .goal-card {
            padding: 28px;
            min-height: 240px;
          }

          .goal-value {
            font-size: 48px;
          }
        }
      `}</style>
    </div>
  );
}
