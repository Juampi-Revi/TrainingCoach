import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { GoalItem } from "../_components/_types";

interface UseGoalsDataResult {
  goals: GoalItem[] | null;
  goalsShared: boolean | null;
  goalsLoading: boolean;
  goalKind: string;
  setGoalKind: React.Dispatch<React.SetStateAction<string>>;
  goalTarget: string;
  setGoalTarget: React.Dispatch<React.SetStateAction<string>>;
  loadGoalsData: (force?: boolean) => Promise<void>;
  addGoal: () => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

function goalMeta(kind: string) {
  if (kind === "steps_daily") return { unit: "steps", period: "daily" };
  if (kind === "sleep_daily") return { unit: "minutes", period: "daily" };
  if (kind === "workouts_weekly") return { unit: "sessions", period: "weekly" };
  return { unit: "count", period: "daily" };
}

export function useGoalsData(clientUserId: string): UseGoalsDataResult {
  const { api } = useAuth();
  const toast = useToast();

  const [goals, setGoals] = useState<GoalItem[] | null>(null);
  const [goalsShared, setGoalsShared] = useState<boolean | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalKind, setGoalKind] = useState("steps_daily");
  const [goalTarget, setGoalTarget] = useState("");

  async function loadGoalsData(force?: boolean) {
    if (!force && (goalsLoading || goals)) return;
    setGoalsLoading(true);
    try {
      const r = await api.get<{ goals: GoalItem[]; shared: boolean }>(`/coach/clients/${clientUserId}/goals`);
      setGoals(r.goals ?? []);
      setGoalsShared(Boolean(r.shared));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando metas");
    } finally {
      setGoalsLoading(false);
    }
  }

  async function addGoal() {
    const raw = goalTarget.trim();
    if (!raw) return;
    const meta = goalMeta(goalKind);
    let targetInt: number | null = null;
    if (goalKind === "sleep_daily") {
      const hrs = Number(raw);
      if (!Number.isFinite(hrs) || hrs <= 0) return;
      targetInt = Math.round(hrs * 60);
    } else {
      const n = Math.trunc(Number(raw));
      if (!Number.isFinite(n) || n <= 0) return;
      targetInt = n;
    }
    try {
      await api.post(`/coach/clients/${clientUserId}/goals`, {
        kind: goalKind, targetInt, unit: meta.unit, period: meta.period,
        startDate: new Date().toISOString().slice(0, 10),
      });
      setGoalTarget("");
      await loadGoalsData(true);
      toast.success("Meta guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando meta");
    }
  }

  async function deleteGoal(goalId: string) {
    try {
      await api.del(`/coach/clients/${clientUserId}/goals/${goalId}`);
      await loadGoalsData(true);
      toast.success("Meta eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando meta");
    }
  }

  return { goals, goalsShared, goalsLoading, goalKind, setGoalKind, goalTarget, setGoalTarget, loadGoalsData, addGoal, deleteGoal };
}
