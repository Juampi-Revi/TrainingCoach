"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ActivitySummary, ExerciseListSummary, ExerciseProgression, MuscleStats } from "@regen/types";
import type { HealthEntry, MetricEntry, FoodEntry, HealthGoal, WeeklySummary, SessionItem } from "../_components/_types";

type RawHealthEntry = {
  id: string;
  day: string;
  steps: number | null;
  sleepMinutes: number | null;
  sportType: string | null;
  sportMinutes: number | null;
  notes: string | null;
  coachNotes: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string } }>;
};

export function useProgresoData() {
  const { api } = useAuth();

  const [health, setHealth] = useState<HealthEntry[] | null>(null);
  const [metrics, setMetrics] = useState<MetricEntry[] | null>(null);
  const [food, setFood] = useState<FoodEntry[] | null>(null);
  const [goals, setGoals] = useState<HealthGoal[] | null>(null);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [sessions, setSessions] = useState<SessionItem[] | null>(null);
  const [activity30, setActivity30] = useState<ActivitySummary | null>(null);
  const [muscles30, setMuscles30] = useState<MuscleStats | null>(null);
  const [exerciseList, setExerciseList] = useState<ExerciseListSummary | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [progression, setProgression] = useState<ExerciseProgression | null>(null);

  // Refs used by loadHealth to hydrate the sleep-tab form on first load
  const didHydrateDailyFormRef = useRef(false);
  const onHealthLoadRef = useRef<((entries: HealthEntry[]) => void) | null>(null);

  const loadHealth = useCallback(() => {
    api
      .get<{ entries: RawHealthEntry[] }>("/client/health?take=21")
      .then((r) => {
        const mapped: HealthEntry[] = (r.entries ?? []).map((e) => ({
          id: e.id,
          day: String(e.day).slice(0, 10),
          steps: e.steps ?? null,
          sleepMinutes: e.sleepMinutes ?? null,
          sportType: e.sportType ?? null,
          sportMinutes: e.sportMinutes ?? null,
          notes: e.notes ?? null,
          coachNotes: (e.coachNotes ?? []).map((n) => ({
            id: n.id,
            text: n.text,
            createdAt: String(n.createdAt),
            coach: n.coach,
          })),
        }));
        setHealth(mapped);
        if (!didHydrateDailyFormRef.current) {
          didHydrateDailyFormRef.current = true;
          onHealthLoadRef.current?.(mapped);
        }
      })
      .catch(console.error);
  }, [api]);

  const loadMetrics = useCallback(() => {
    api.get<MetricEntry[]>("/client/metrics").then(setMetrics).catch(console.error);
  }, [api]);

  const loadFood = useCallback(() => {
    api
      .get<{ items: FoodEntry[] }>("/client/food?take=30")
      .then((r) => setFood(r.items ?? []))
      .catch(console.error);
  }, [api]);

  const loadSessions = useCallback(() => {
    api
      .get<{ items: SessionItem[] }>("/client/sessions?limit=30")
      .then((r) => setSessions(r.items ?? []))
      .catch(console.error);
  }, [api]);

  const loadGoals = useCallback(() => {
    api
      .get<{ goals: HealthGoal[] }>("/client/goals")
      .then((r) => setGoals(r.goals ?? []))
      .catch(console.error);
  }, [api]);

  const loadSummary = useCallback(() => {
    api.get<WeeklySummary>("/client/summary/week?days=7").then(setSummary).catch(console.error);
  }, [api]);

  const loadActivity30 = useCallback(() => {
    api.get<ActivitySummary>("/client/summary/activity?days=30").then(setActivity30).catch(console.error);
  }, [api]);

  const loadMuscles30 = useCallback(() => {
    api.get<MuscleStats>("/client/summary/muscles?days=30").then(setMuscles30).catch(console.error);
  }, [api]);

  const loadExerciseList = useCallback(() => {
    api.get<ExerciseListSummary>("/client/summary/exercises?days=180").then(setExerciseList).catch(console.error);
  }, [api]);

  const loadProgression = useCallback(
    (exerciseId: string) => {
      if (!exerciseId) return;
      api
        .get<ExerciseProgression>(`/client/summary/exercises/${exerciseId}/progression?days=180`)
        .then(setProgression)
        .catch(console.error);
    },
    [api]
  );

  useEffect(() => {
    loadHealth();
    loadMetrics();
    loadFood();
    loadSessions();
    loadGoals();
    loadSummary();
    loadActivity30();
    loadMuscles30();
    loadExerciseList();
  }, [loadHealth, loadMetrics, loadFood, loadSessions, loadGoals, loadSummary, loadActivity30, loadMuscles30, loadExerciseList]);

  const effectiveExerciseId = useMemo(
    () => selectedExerciseId || exerciseList?.items?.[0]?.id || "",
    [exerciseList, selectedExerciseId]
  );

  useEffect(() => {
    if (!effectiveExerciseId) return;
    loadProgression(effectiveExerciseId);
  }, [effectiveExerciseId, loadProgression]);

  return {
    health,
    metrics,
    food,
    goals,
    summary,
    sessions,
    activity30,
    muscles30,
    exerciseList,
    selectedExerciseId,
    setSelectedExerciseId,
    progression,
    effectiveExerciseId,
    onHealthLoadRef,
    loadHealth,
    loadMetrics,
    loadFood,
    loadSessions,
    loadGoals,
    loadSummary,
  };
}
