"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, Card, Icon, KPI, StateBlock, Tabs } from "@/components/ui";
import type { ActivitySummary, ExerciseListSummary, ExerciseProgression, ExerciseSummary, MuscleStats } from "@regen/types";

type HealthEntry = {
  id: string;
  day: string;
  steps: number | null;
  sleepMinutes: number | null;
  sportType: string | null;
  sportMinutes: number | null;
  notes: string | null;
  coachNotes: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string } }>;
};

type MetricEntry = {
  id: string;
  measuredAt: string;
  weightKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  hipsCm: string | null;
  armCm: string | null;
  thighCm: string | null;
  notes: string | null;
};

type FoodEntry = {
  id: string;
  loggedAt: string;
  text: string | null;
  photoUrl: string | null;
  source: string;
  coachComments: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string | null } }>;
};

type HealthGoal = {
  id: string;
  kind: string;
  targetInt: number | null;
  targetNumber: string | null;
  unit: string;
  period: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
};

type WeeklySummary = {
  range: { start: string; end: string; days: number };
  health: { daysWithEntry: number; stepsTotal: number; sleepAvgMinutes: number | null; sportMinutesTotal: number };
  food: { count: number };
  workouts: { total: number; completed: number };
  latestWeight: { measuredAt: string; weightKg: string } | null;
};

type SessionItem = {
  id: string;
  status: string;
  performedAt: string;
  workoutTemplate: { id: string; title: string; tags: string[] } | null;
  totalVolumeKg: number;
  setsCount: number;
};

type TabKey = "Dashboard" | "Actividad" | "Sueño" | "Mediciones" | "Comidas" | "Entrenamientos";

function fmtSleep(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

function addDaysUTC(isoDay: string, deltaDays: number) {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  legs: "Piernas",
  glutes: "Glúteos",
  core: "Core",
  calves: "Pantorrillas",
  forearms: "Antebrazos",
  full_body: "Cuerpo completo",
  other: "Otros",
};

function muscleLabel(m: string) {
  return MUSCLE_LABEL[m] ?? m;
}

function goalLabel(kind: string) {
  if (kind === "steps_daily") return "Pasos diarios";
  if (kind === "sleep_daily") return "Sueño diario";
  if (kind === "workouts_weekly") return "Entrenos semanales";
  return kind;
}

function goalBadge(kind: string) {
  if (kind === "steps_daily") return { tone: "limeSoft" as const, icon: "chart" as const };
  if (kind === "sleep_daily") return { tone: "info" as const, icon: "moon" as const };
  if (kind === "workouts_weekly") return { tone: "neutral" as const, icon: "dumbbell" as const };
  return { tone: "neutral" as const, icon: "star" as const };
}

export default function ProgresoPage() {
  const { api, token } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>("Dashboard");

  const [health, setHealth] = useState<HealthEntry[] | null>(null);
  const [healthDay, setHealthDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sportType, setSportType] = useState("");
  const [sportMinutes, setSportMinutes] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");
  const [savingDaily, setSavingDaily] = useState(false);

  const [metrics, setMetrics] = useState<MetricEntry[] | null>(null);
  const [measuredAt, setMeasuredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [chestCm, setChestCm] = useState("");
  const [armCm, setArmCm] = useState("");
  const [thighCm, setThighCm] = useState("");
  const [metricNotes, setMetricNotes] = useState("");
  const [savingMetric, setSavingMetric] = useState(false);

  const [food, setFood] = useState<FoodEntry[] | null>(null);
  const [foodAt, setFoodAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [foodText, setFoodText] = useState("");
  const [foodPhotoUrl, setFoodPhotoUrl] = useState("");
  const [foodPhotoFile, setFoodPhotoFile] = useState<File | null>(null);
  const [savingFood, setSavingFood] = useState(false);
  const [foodError, setFoodError] = useState<string | null>(null);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingFoodAt, setEditingFoodAt] = useState("");
  const [editingFoodText, setEditingFoodText] = useState("");
  const [editingFoodPhotoUrl, setEditingFoodPhotoUrl] = useState("");
  const [editingFoodPhotoFile, setEditingFoodPhotoFile] = useState<File | null>(null);
  const [savingFoodEdit, setSavingFoodEdit] = useState(false);

  const [goals, setGoals] = useState<HealthGoal[] | null>(null);
  const [goalKind, setGoalKind] = useState("steps_daily");
  const [goalTarget, setGoalTarget] = useState("");

  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  const [sessions, setSessions] = useState<SessionItem[] | null>(null);
  const [activity30, setActivity30] = useState<ActivitySummary | null>(null);
  const [muscles30, setMuscles30] = useState<MuscleStats | null>(null);
  const [exerciseList, setExerciseList] = useState<ExerciseListSummary | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [progression, setProgression] = useState<ExerciseProgression | null>(null);

  const didHydrateDailyFormRef = useRef(false);
  const healthDayRef = useRef(healthDay);
  useEffect(() => {
    healthDayRef.current = healthDay;
  }, [healthDay]);

  const loadHealth = useCallback(() => {
    api
      .get<{ entries: Array<any> }>("/client/health?take=21")
      .then((r) => {
        const mapped: HealthEntry[] = (r.entries ?? []).map((e) => ({
          id: e.id,
          day: String(e.day).slice(0, 10),
          steps: e.steps ?? null,
          sleepMinutes: e.sleepMinutes ?? null,
          sportType: e.sportType ?? null,
          sportMinutes: e.sportMinutes ?? null,
          notes: e.notes ?? null,
          coachNotes: (e.coachNotes ?? []).map((n: any) => ({
            id: n.id,
            text: n.text,
            createdAt: String(n.createdAt),
            coach: n.coach,
          })),
        }));
        setHealth(mapped);
        if (!didHydrateDailyFormRef.current) {
          const day = healthDayRef.current;
          const existing = mapped.find((x) => x.day === day) ?? null;
          if (existing) {
            setSteps(existing.steps != null ? String(existing.steps) : "");
            setSleepHours(existing.sleepMinutes != null ? String(Math.round((existing.sleepMinutes / 60) * 10) / 10) : "");
            setSportType(existing.sportType ?? "");
            setSportMinutes(existing.sportMinutes != null ? String(existing.sportMinutes) : "");
            setDailyNotes(existing.notes ?? "");
          }
          didHydrateDailyFormRef.current = true;
        }
      })
      .catch(console.error);
  }, [api]);

  const loadMetrics = useCallback(() => {
    api.get<MetricEntry[]>("/client/metrics").then(setMetrics).catch(console.error);
  }, [api]);

  const loadFood = useCallback(() => {
    api.get<{ items: FoodEntry[] }>("/client/food?take=30").then((r) => setFood(r.items ?? [])).catch(console.error);
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
      api.get<ExerciseProgression>(`/client/summary/exercises/${exerciseId}/progression?days=180`).then(setProgression).catch(console.error);
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

  const selectedDaily = useMemo(() => {
    const list = health ?? [];
    return list.find((e) => e.day === healthDay) ?? null;
  }, [health, healthDay]);

  function selectHealthDay(nextDay: string) {
    setHealthDay(nextDay);
    const existing = (health ?? []).find((x) => x.day === nextDay) ?? null;
    if (!existing) {
      setSteps("");
      setSleepHours("");
      setSportType("");
      setSportMinutes("");
      setDailyNotes("");
      return;
    }
    setSteps(existing.steps != null ? String(existing.steps) : "");
    setSleepHours(existing.sleepMinutes != null ? String(Math.round((existing.sleepMinutes / 60) * 10) / 10) : "");
    setSportType(existing.sportType ?? "");
    setSportMinutes(existing.sportMinutes != null ? String(existing.sportMinutes) : "");
    setDailyNotes(existing.notes ?? "");
  }

  async function saveDaily() {
    setSavingDaily(true);
    try {
      await api.post("/client/health", {
        day: healthDay,
        steps: steps ? Number(steps) : null,
        sleepHours: sleepHours ? Number(sleepHours) : null,
        sportType: sportType ? sportType : null,
        sportMinutes: sportMinutes ? Number(sportMinutes) : null,
        notes: dailyNotes ? dailyNotes : null,
      });
      loadHealth();
      toast.success("Registro guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingDaily(false);
    }
  }

  async function saveMetric() {
    if (!measuredAt) return;
    setSavingMetric(true);
    try {
      await api.post("/client/metrics", {
        measuredAt,
        weightKg: weightKg ? Number(weightKg) : null,
        waistCm: waistCm ? Number(waistCm) : null,
        hipsCm: hipsCm ? Number(hipsCm) : null,
        chestCm: chestCm ? Number(chestCm) : null,
        armCm: armCm ? Number(armCm) : null,
        thighCm: thighCm ? Number(thighCm) : null,
        notes: metricNotes ? metricNotes : null,
      });
      setWeightKg("");
      setWaistCm("");
      setHipsCm("");
      setChestCm("");
      setArmCm("");
      setThighCm("");
      setMetricNotes("");
      loadMetrics();
      toast.success("Medición registrada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al registrar");
    } finally {
      setSavingMetric(false);
    }
  }

  async function uploadFoodPhoto(file: File): Promise<string> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API_BASE}/client/food/photo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });

    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: { url?: string }; error?: string } | null;
    if (!res.ok || !json?.ok || !json.data?.url) {
      throw new Error(json?.error ?? "Error subiendo foto");
    }
    return json.data.url;
  }

  async function saveFoodEntry() {
    setSavingFood(true);
    setFoodError(null);
    try {
      const uploadedUrl = foodPhotoFile ? await uploadFoodPhoto(foodPhotoFile) : null;
      await api.post("/client/food", {
        loggedAt: foodAt ? new Date(foodAt).toISOString() : null,
        text: foodText ? foodText : null,
        photoUrl: uploadedUrl ?? (foodPhotoUrl ? foodPhotoUrl : null),
      });
      setFoodText("");
      setFoodPhotoUrl("");
      setFoodPhotoFile(null);
      loadFood();
      loadSummary();
      toast.success("Comida registrada");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al registrar";
      setFoodError(msg);
      toast.error(msg);
    } finally {
      setSavingFood(false);
    }
  }

  async function saveFoodEdit() {
    if (!editingFoodId) return;
    setSavingFoodEdit(true);
    try {
      const uploadedUrl = editingFoodPhotoFile ? await uploadFoodPhoto(editingFoodPhotoFile) : null;
      await api.patch(`/client/food/${editingFoodId}`, {
        loggedAt: editingFoodAt ? new Date(editingFoodAt).toISOString() : undefined,
        text: editingFoodText,
        photoUrl: uploadedUrl ?? editingFoodPhotoUrl,
      });
      setEditingFoodId(null);
      setEditingFoodAt("");
      setEditingFoodText("");
      setEditingFoodPhotoUrl("");
      setEditingFoodPhotoFile(null);
      loadFood();
      loadSummary();
      toast.success("Comida actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setSavingFoodEdit(false);
    }
  }

  async function deleteFoodEntry(foodId: string) {
    try {
      await api.del(`/client/food/${foodId}`);
      if (editingFoodId === foodId) setEditingFoodId(null);
      loadFood();
      loadSummary();
      toast.success("Comida eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  function goalMeta() {
    if (goalKind === "steps_daily") return { unit: "steps", period: "daily", label: "Pasos diarios", placeholder: "8000" };
    if (goalKind === "sleep_daily") return { unit: "minutes", period: "daily", label: "Sueño diario (horas)", placeholder: "7.5" };
    if (goalKind === "workouts_weekly") return { unit: "sessions", period: "weekly", label: "Entrenos semanales", placeholder: "3" };
    return { unit: "count", period: "daily", label: "Meta", placeholder: "0" };
  }

  async function addGoal() {
    const meta = goalMeta();
    const raw = goalTarget.trim();
    if (!raw) return;
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
      await api.post("/client/goals", {
        kind: goalKind,
        targetInt,
        unit: meta.unit,
        period: meta.period,
        startDate: todayIso,
      });
      setGoalTarget("");
      loadGoals();
      toast.success("Meta guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando meta");
    }
  }

  async function deleteGoal(goalId: string) {
    try {
      await api.del(`/client/goals/${goalId}`);
      loadGoals();
      toast.success("Meta eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando meta");
    }
  }

  const steps7 = useMemo(() => {
    const list = (health ?? []).slice(0, 7).reverse();
    const maxSteps = Math.max(...list.map((e) => e.steps ?? 0), 1);
    return { list, maxSteps };
  }, [health]);

  const sleep7 = useMemo(() => {
    const list = (health ?? []).slice(0, 7).reverse();
    const maxMin = Math.max(...list.map((e) => e.sleepMinutes ?? 0), 1);
    return { list, maxMin };
  }, [health]);

  const weightSeries = useMemo(() => {
    const list = metrics ?? [];
    return list
      .filter((m) => m.weightKg)
      .slice(0, 20)
      .map((m) => ({ day: m.measuredAt.slice(0, 10), weight: parseFloat(m.weightKg!) }))
      .reverse();
  }, [metrics]);

  const [minW, maxW] = useMemo(() => {
    if (!weightSeries.length) return [0, 1];
    const min = Math.min(...weightSeries.map((x) => x.weight));
    const max = Math.max(...weightSeries.map((x) => x.weight));
    return [min, max];
  }, [weightSeries]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayHealth = useMemo(() => (health ?? []).find((e) => e.day === todayIso) ?? null, [health, todayIso]);
  const latestWeight = useMemo(() => (metrics ?? [])[0]?.weightKg ?? null, [metrics]);

  const sessionsLast7Days = useMemo(() => {
    const list = sessions ?? [];
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return list.filter((s) => new Date(s.performedAt) >= from && s.status !== "discarded").length;
  }, [sessions]);

  const activityGrid = useMemo(() => {
    if (!activity30?.range) return null;
    const start = activity30.range.start;
    const end = activity30.range.end;
    const days = activity30.range.days;
    const from = days >= 30 ? addDaysUTC(end, -29) : start;
    const set = new Set(activity30.activeDays ?? []);
    const items: Array<{ day: string; active: boolean }> = [];
    const count = Math.min(30, days);
    const startIdx = count === 30 ? days - 30 : 0;
    for (let i = 0; i < count; i++) {
      const day = addDaysUTC(start, startIdx + i);
      items.push({ day, active: set.has(day) });
    }
    return { from, to: end, items };
  }, [activity30]);

  const muscleTop = useMemo(() => {
    const items = muscles30?.items ?? [];
    const max = Math.max(...items.map((x) => x.sets), 1);
    return { max, items: items.slice(0, 10) };
  }, [muscles30]);

  const progressionSeries = useMemo(() => {
    const points = (progression?.points ?? []).slice(-30);
    if (points.length === 0) return null;
    const vals = points.map((p) => p.bestEst1rm);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { points, min, max };
  }, [progression]);

  const selectedExercise = useMemo(() => {
    const items = exerciseList?.items ?? [];
    const id = effectiveExerciseId;
    return items.find((x) => x.id === id) ?? null;
  }, [effectiveExerciseId, exerciseList]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Progreso</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Dashboard, salud, comidas, mediciones y entrenamientos</div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Tabs
          variant="pills"
          tabs={["Dashboard", "Actividad", "Sueño", "Mediciones", "Comidas", "Entrenamientos"]}
          active={tab}
          onChange={(t) => setTab(t as TabKey)}
        />
      </div>

      {tab === "Dashboard" ? (
        <>
          <div style={{ padding: "0 20px 12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <KPI label="Pasos (hoy)" value={todayHealth?.steps != null ? todayHealth.steps.toLocaleString("es") : "—"} />
              <KPI label="Sueño (hoy)" value={fmtSleep(todayHealth?.sleepMinutes ?? null)} />
              <KPI label="Peso (último)" value={latestWeight ? parseFloat(latestWeight).toFixed(1) : "—"} unit={latestWeight ? "kg" : undefined} />
              <KPI label="Entrenos (7d)" value={sessions == null ? "…" : String(sessionsLast7Days)} />
            </div>
          </div>

          <div style={{ padding: "0 20px 12px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="chart" size={16} color="var(--text-mute)" />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Resumen (7 días)</div>
                </div>
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                  {summary?.range ? `${summary.range.start} → ${summary.range.end}` : summary ? "—" : "…"}
                </div>
              </div>
              {!summary ? (
                <StateBlock kind="loading" title="Cargando resumen…" />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <KPI label="Pasos total" value={summary.health.stepsTotal.toLocaleString("es")} />
                  <KPI label="Sueño prom." value={fmtSleep(summary.health.sleepAvgMinutes)} />
                  <KPI label="Deporte" value={summary.health.sportMinutesTotal.toLocaleString("es")} unit="min" />
                  <KPI label="Entrenos" value={`${summary.workouts.completed}/${summary.workouts.total}`} />
                  <div style={{ gridColumn: "1 / -1", padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)" }}>
                    <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                      Comidas: {summary.food.count} {" · "} Registros salud: {summary.health.daysWithEntry}
                      {summary.latestWeight ? ` · Peso: ${parseFloat(summary.latestWeight.weightKg).toFixed(1)}kg (${summary.latestWeight.measuredAt})` : ""}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div style={{ padding: "0 20px 12px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="calendar" size={16} color="var(--text-mute)" />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Actividad (30 días)</div>
                </div>
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                  {activityGrid ? `${activityGrid.from} → ${activityGrid.to}` : activity30 ? "—" : "…"}
                </div>
              </div>
              {!activity30 ? (
                <StateBlock kind="loading" title="Cargando actividad…" />
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <KPI label="Días activos" value={String(activity30.activeDaysCount)} unit="días" />
                    <KPI label="Deporte" value={activity30.sportMinutesTotal.toLocaleString("es")} unit="min" />
                    <KPI label="Entrenos" value={String(activity30.sessionsCompleted)} unit="sesiones" />
                    <KPI label="Energía prom." value={activity30.energyAvg != null ? String(activity30.energyAvg) : "—"} unit="/5" />
                  </div>
                  {activityGrid && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
                        {activityGrid.items.map((d) => (
                          <div
                            key={d.day}
                            title={d.day}
                            style={{
                              height: 14,
                              borderRadius: 4,
                              background: d.active ? "var(--lime)" : "var(--bg-2)",
                              border: `1px solid ${d.active ? "var(--lime)" : "var(--line)"}`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 8 }}>
                        {activityGrid.from} {" · "} {activityGrid.to}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>

          <div style={{ padding: "0 20px 12px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="star" size={16} color="var(--text-mute)" />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Metas</div>
                </div>
                <Badge tone="neutral" icon="lock">Integraciones: manual</Badge>
              </div>
              {goals === null ? (
                <StateBlock kind="loading" title="Cargando metas…" />
              ) : (
                <>
                  {goals.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 10 }}>Todavía no tenés metas.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                      {goals.slice(0, 6).map((g) => (
                        <div key={g.id} style={{ padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Badge tone={goalBadge(g.kind).tone} icon={goalBadge(g.kind).icon}>{goalLabel(g.kind)}</Badge>
                              <div className="ta-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                                {g.targetInt != null ? String(g.targetInt) : g.targetNumber ?? "—"} {g.unit}
                              </div>
                            </div>
                            <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                              {g.period} {" · "} desde {String(g.startDate).slice(0, 10)}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" icon="trash" onClick={() => deleteGoal(g.id)}>Borrar</Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Tipo</div>
                      <select
                        value={goalKind}
                        onChange={(e) => setGoalKind(e.target.value)}
                        style={{ width: "100%", background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                      >
                        <option value="steps_daily">Pasos diarios</option>
                        <option value="sleep_daily">Sueño diario</option>
                        <option value="workouts_weekly">Entrenos semanales</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Objetivo</div>
                      <input
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        placeholder={goalMeta().placeholder}
                        style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <Button disabled={!goalTarget.trim()} icon="plus" onClick={addGoal}>Agregar meta</Button>
                  </div>
                </>
              )}
            </Card>
          </div>

          <div style={{ padding: "0 20px 12px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="repeat" size={16} color="var(--text-mute)" />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Integraciones</div>
                </div>
                <Badge tone="warn" icon="lock">Próximamente</Badge>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-mute)", lineHeight: 1.45 }}>
                Por ahora los datos de pasos/sueño/deporte se cargan manualmente. La importación desde reloj (Apple Health / Google Fit) todavía no está implementada.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Apple Health</div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>iOS</div>
                  <div style={{ marginTop: 10 }}>
                    <Button variant="outline" block disabled icon="lock">Conectar</Button>
                  </div>
                </div>
                <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Google Fit</div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>Android</div>
                  <div style={{ marginTop: 10 }}>
                    <Button variant="outline" block disabled icon="lock">Conectar</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ padding: "0 20px 12px" }}>
            <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Registro diario</div>
                <input
                  type="date"
                  value={healthDay}
                  onChange={(e) => selectHealthDay(e.target.value)}
                  style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Pasos</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="0"
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Sueño (horas)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="0.0"
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Deporte</div>
                  <input
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    placeholder="Correr, bici, fútbol…"
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Minutos</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={sportMinutes}
                    onChange={(e) => setSportMinutes(e.target.value)}
                    placeholder="0"
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Notas</div>
                <textarea
                  value={dailyNotes}
                  onChange={(e) => setDailyNotes(e.target.value)}
                  placeholder="Cómo te sentiste, molestias, hambre, energía…"
                  rows={3}
                  style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <Button disabled={savingDaily} onClick={saveDaily}>
                  {savingDaily ? "Guardando…" : "Guardar"}
                </Button>
              </div>

              {selectedDaily?.coachNotes?.length ? (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                    Feedback del coach
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedDaily.coachNotes.slice(-3).map((n) => (
                      <div key={n.id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{n.coach.name}</div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, whiteSpace: "pre-wrap" }}>{n.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : tab === "Actividad" ? (
        <>
          {health === null ? (
            <StateBlock kind="loading" title="Cargando salud…" />
          ) : (
            <>
              <div style={{ padding: "0 20px 12px" }}>
                <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                    <span>Últimos 7 días · pasos</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>{steps7.maxSteps.toLocaleString("es")}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                    {steps7.list.map((e) => {
                      const h = ((e.steps ?? 0) / steps7.maxSteps) * 100;
                      return (
                        <div key={e.id} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6 }}>
                          <div style={{ height: `${h}%`, background: "var(--lime)", borderRadius: 6, minHeight: 4 }} />
                          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", textAlign: "center" }}>
                            {e.day.slice(8, 10)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 20px" }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
                  Registros
                </div>
                {health.length === 0 ? (
                  <StateBlock kind="empty" title="Sin registros" body="Cargá tus pasos y sueño para empezar." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {health.slice(0, 14).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => selectHealthDay(e.day)}
                        style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, cursor: "pointer" }}
                        className="ta-row"
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                          <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                            {new Date(e.day).toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })}
                          </div>
                          <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                            {e.steps != null ? `${e.steps.toLocaleString("es")} pasos` : "—"} {" · "} {e.sportMinutes ? `${e.sportMinutes}m` : "—"}
                          </div>
                        </div>
                        {e.sportType || e.sportMinutes ? (
                          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 6 }}>
                            {e.sportType ?? "Deporte"}{e.sportMinutes ? ` · ${e.sportMinutes}m` : ""}
                          </div>
                        ) : null}
                        {e.coachNotes?.length ? (
                          <div style={{ fontSize: 12, color: "var(--text)", marginTop: 6 }}>
                            <span style={{ color: "var(--text-mute)" }}>Coach:</span> {e.coachNotes[e.coachNotes.length - 1].text}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : tab === "Sueño" ? (
        <>
          {health === null ? (
            <StateBlock kind="loading" title="Cargando sueño…" />
          ) : (
            <>
              <div style={{ padding: "0 20px 12px" }}>
                <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                    <span>Últimos 7 días · sueño</span>
                    <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>{fmtSleep(sleep7.maxMin)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                    {sleep7.list.map((e) => {
                      const h = (((e.sleepMinutes ?? 0) / sleep7.maxMin) * 100) || 0;
                      return (
                        <div key={e.id} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6 }}>
                          <div style={{ height: `${h}%`, background: "var(--lime)", borderRadius: 6, minHeight: 4 }} />
                          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", textAlign: "center" }}>
                            {e.day.slice(8, 10)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 20px" }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
                  Registros
                </div>
                {health.length === 0 ? (
                  <StateBlock kind="empty" title="Sin registros" body="Cargá tu sueño para empezar." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {health.slice(0, 14).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => selectHealthDay(e.day)}
                        style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, cursor: "pointer" }}
                        className="ta-row"
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                          <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                            {new Date(e.day).toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })}
                          </div>
                          <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                            {fmtSleep(e.sleepMinutes)}
                          </div>
                        </div>
                        {e.notes ? (
                          <div style={{ fontSize: 12, color: "var(--text)", marginTop: 6, whiteSpace: "pre-wrap" }}>{e.notes}</div>
                        ) : null}
                        {e.coachNotes?.length ? (
                          <div style={{ fontSize: 12, color: "var(--text)", marginTop: 6 }}>
                            <span style={{ color: "var(--text-mute)" }}>Coach:</span> {e.coachNotes[e.coachNotes.length - 1].text}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : tab === "Mediciones" ? (
        <>
          <div style={{ padding: "0 20px 12px" }}>
            <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Nueva medición</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Fecha</div>
                  <input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Peso (kg)</div>
                  <input type="number" inputMode="decimal" value={weightKg ?? ""} onChange={(e) => setWeightKg(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Cintura (cm)</div>
                  <input type="number" inputMode="decimal" value={waistCm ?? ""} onChange={(e) => setWaistCm(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Cadera (cm)</div>
                  <input type="number" inputMode="decimal" value={hipsCm ?? ""} onChange={(e) => setHipsCm(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Pecho (cm)</div>
                  <input type="number" inputMode="decimal" value={chestCm ?? ""} onChange={(e) => setChestCm(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Brazo (cm)</div>
                  <input type="number" inputMode="decimal" value={armCm ?? ""} onChange={(e) => setArmCm(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Muslo (cm)</div>
                  <input type="number" inputMode="decimal" value={thighCm ?? ""} onChange={(e) => setThighCm(e.target.value)} placeholder="0.0" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" }} />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Notas</div>
                <textarea value={metricNotes} onChange={(e) => setMetricNotes(e.target.value)} rows={3} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <Button disabled={savingMetric || (!weightKg && !waistCm && !hipsCm && !chestCm && !armCm && !thighCm)} onClick={saveMetric}>
                  {savingMetric ? "Guardando…" : "Registrar"}
                </Button>
              </div>
            </div>
          </div>

          {metrics === null ? (
            <StateBlock kind="loading" title="Cargando mediciones…" />
          ) : (
            <>
              {weightSeries.length > 1 && (
                <div style={{ padding: "0 20px 12px" }}>
                  <div style={{ padding: 16, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                      <span>Peso corporal</span>
                      <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>últimas {Math.min(20, weightSeries.length)}</span>
                    </div>
                    <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                      {weightSeries.map((p, i, arr) => {
                        if (arr.length < 2 || i === 0) return null;
                        const x = (i / (arr.length - 1)) * 300;
                        const y = 80 - (((p.weight - minW) / ((maxW - minW) || 1)) * 60 + 10);
                        const px = ((i - 1) / (arr.length - 1)) * 300;
                        const py = 80 - (((arr[i - 1].weight - minW) / ((maxW - minW) || 1)) * 60 + 10);
                        return <line key={p.day} x1={px} y1={py} x2={x} y2={y} stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" />;
                      })}
                      {weightSeries.map((p, i, arr) => {
                        const x = (i / (arr.length - 1)) * 300;
                        const y = 80 - (((p.weight - minW) / ((maxW - minW) || 1)) * 60 + 10);
                        return <circle key={`${p.day}-c`} cx={x} cy={y} r={i === arr.length - 1 ? 4 : 2} fill="var(--lime)" />;
                      })}
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-mute)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                      <span>{minW.toFixed(1)}kg</span>
                      <span>{maxW.toFixed(1)}kg</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ padding: "0 20px" }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
                  Historial
                </div>
                {metrics.length === 0 ? (
                  <StateBlock kind="empty" title="Sin mediciones" body="Registrá tu primer peso o medida." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {metrics.slice(0, 20).map((m) => (
                      <div key={m.id} style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                          <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                            {new Date(m.measuredAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          <div className="ta-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                            {m.weightKg ? `${parseFloat(m.weightKg).toFixed(1)}kg` : "—"}
                          </div>
                        </div>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                          {m.waistCm ? `Cintura ${m.waistCm}cm` : "Cintura —"} {" · "} {m.hipsCm ? `Cadera ${m.hipsCm}cm` : "Cadera —"}
                        </div>
                        {m.notes ? (
                          <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6, whiteSpace: "pre-wrap" }}>{m.notes}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : tab === "Comidas" ? (
        <>
          <div style={{ padding: "0 20px 12px" }}>
            <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Registrar comida</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Fecha y hora</div>
                  <input
                    type="datetime-local"
                    value={foodAt}
                    onChange={(e) => setFoodAt(e.target.value)}
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Qué comiste</div>
                  <textarea
                    value={foodText}
                    onChange={(e) => setFoodText(e.target.value)}
                    rows={3}
                    placeholder="Ej: desayuno: café + 2 tostadas + fruta…"
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Foto</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFoodPhotoFile(e.target.files?.[0] ?? null)}
                    style={{ width: "100%", background: "transparent", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Foto (URL opcional)</div>
                  <input
                    value={foodPhotoUrl}
                    onChange={(e) => setFoodPhotoUrl(e.target.value)}
                    placeholder="https://…"
                    style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                  />
                </div>
              </div>

              {foodError ? <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{foodError}</div> : null}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <Button disabled={savingFood || !foodText.trim()} onClick={saveFoodEntry}>
                  {savingFood ? "Guardando…" : "Registrar"}
                </Button>
              </div>
            </div>
          </div>

          {food === null ? (
            <StateBlock kind="loading" title="Cargando comidas…" />
          ) : (
            <div style={{ padding: "0 20px" }}>
              <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
                Historial
              </div>
              {food.length === 0 ? (
                <StateBlock kind="empty" title="Sin comidas" body="Registrá tu primera comida para empezar." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {food.slice(0, 30).map((f) => (
                    <div key={f.id} style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                        <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                          {new Date(f.loggedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="edit"
                            onClick={() => {
                              setEditingFoodId(f.id);
                              setEditingFoodAt(new Date(f.loggedAt).toISOString().slice(0, 16));
                              setEditingFoodText(f.text ?? "");
                              setEditingFoodPhotoUrl(f.photoUrl ?? "");
                              setEditingFoodPhotoFile(null);
                            }}
                          >
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" icon="trash" onClick={() => deleteFoodEntry(f.id)}>Borrar</Button>
                        </div>
                      </div>

                      {editingFoodId === f.id ? (
                        <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Fecha y hora</div>
                              <input
                                type="datetime-local"
                                value={editingFoodAt}
                                onChange={(e) => setEditingFoodAt(e.target.value)}
                                style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }}
                              />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Texto</div>
                              <textarea
                                value={editingFoodText}
                                onChange={(e) => setEditingFoodText(e.target.value)}
                                rows={3}
                                style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }}
                              />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Foto</div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditingFoodPhotoFile(e.target.files?.[0] ?? null)}
                                style={{ width: "100%", background: "transparent", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                              />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 }}>Foto (URL)</div>
                              <input
                                value={editingFoodPhotoUrl}
                                onChange={(e) => setEditingFoodPhotoUrl(e.target.value)}
                                placeholder="https://…"
                                style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                              />
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingFoodId(null);
                                setEditingFoodAt("");
                                setEditingFoodText("");
                                setEditingFoodPhotoUrl("");
                                setEditingFoodPhotoFile(null);
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button size="sm" disabled={savingFoodEdit} icon="check" onClick={saveFoodEdit}>
                              {savingFoodEdit ? "Guardando…" : "Guardar"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            {f.source && f.source !== "manual" ? <Badge tone="info">EXTERNAL</Badge> : <Badge tone="neutral">MANUAL</Badge>}
                            {f.coachComments?.length ? <Badge tone="limeSoft" icon="msg">{String(f.coachComments.length)}</Badge> : null}
                          </div>
                          {f.text ? (
                            <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6, whiteSpace: "pre-wrap" }}>{f.text}</div>
                          ) : null}
                          {f.photoUrl ? (
                            <a href={f.photoUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", fontSize: 12, marginTop: 8, color: "var(--lime-high)" }}>
                              Ver foto
                            </a>
                          ) : null}
                        </>
                      )}

                      {f.coachComments?.length ? (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                          <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                            Comentarios del coach
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {f.coachComments.slice(0, 3).map((c) => (
                              <div key={c.id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{c.coach.name ?? "Coach"}</div>
                                <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, whiteSpace: "pre-wrap" }}>{c.text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : tab === "Entrenamientos" ? (
        <>
          {sessions === null ? (
            <StateBlock kind="loading" title="Cargando entrenamientos…" />
          ) : (
            <>
              <div style={{ padding: "0 20px 12px" }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="chart" size={16} color="var(--text-mute)" />
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Grupos musculares (30 días)</div>
                    </div>
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                      {muscles30?.range ? `${muscles30.range.start} → ${muscles30.range.end}` : muscles30 ? "—" : "…"}
                    </div>
                  </div>
                  {!muscles30 ? (
                    <StateBlock kind="loading" title="Cargando grupos musculares…" />
                  ) : muscles30.items.length === 0 ? (
                    <StateBlock kind="empty" title="Sin datos" body="Completá entrenamientos para ver los grupos musculares." />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {muscleTop.items.map((m) => (
                        <div key={m.muscle} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, alignItems: "center" }}>
                          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text)" }}>{muscleLabel(m.muscle)}</div>
                          <div style={{ height: 10, borderRadius: 999, background: "var(--bg-2)", border: "1px solid var(--line)", overflow: "hidden" }}>
                            <div style={{ width: `${Math.round((m.sets / muscleTop.max) * 100)}%`, height: "100%", background: "var(--lime)" }} />
                          </div>
                          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>{m.sets} sets</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <div style={{ padding: "0 20px 12px" }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="dumbbell" size={16} color="var(--text-mute)" />
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Progresión por ejercicio</div>
                    </div>
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                      {progression?.range ? `${progression.range.start} → ${progression.range.end}` : progression ? "—" : "…"}
                    </div>
                  </div>

                  {!exerciseList ? (
                    <StateBlock kind="loading" title="Cargando ejercicios…" />
                  ) : exerciseList.items.length === 0 ? (
                    <StateBlock kind="empty" title="Sin ejercicios" body="Completá sesiones para ver progresión por ejercicio." />
                  ) : (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                        <select
                          value={selectedExerciseId || effectiveExerciseId}
                          onChange={(e) => setSelectedExerciseId(e.target.value)}
                          style={{ width: "100%", background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                        >
                          {exerciseList.items.slice(0, 300).map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                        {selectedExercise?.primaryMuscle ? (
                          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                            {muscleLabel(selectedExercise.primaryMuscle)}
                          </div>
                        ) : null}
                      </div>

                      {!progression ? (
                        <div style={{ marginTop: 10 }}>
                          <StateBlock kind="loading" title="Cargando progresión…" />
                        </div>
                      ) : !progressionSeries || progressionSeries.points.length === 0 ? (
                        <div style={{ marginTop: 10 }}>
                          <StateBlock kind="empty" title="Sin datos" body="Registrá series con peso y reps para ver la progresión." />
                        </div>
                      ) : (
                        <div style={{ marginTop: 10 }}>
                          {progressionSeries.points.length > 1 && (
                            <div style={{ padding: 12, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                              <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                                {progressionSeries.points.map((p, i, arr) => {
                                  if (arr.length < 2 || i === 0) return null;
                                  const x = (i / (arr.length - 1)) * 300;
                                  const y = 80 - (((p.bestEst1rm - progressionSeries.min) / ((progressionSeries.max - progressionSeries.min) || 1)) * 60 + 10);
                                  const px = ((i - 1) / (arr.length - 1)) * 300;
                                  const py = 80 - (((arr[i - 1].bestEst1rm - progressionSeries.min) / ((progressionSeries.max - progressionSeries.min) || 1)) * 60 + 10);
                                  return <line key={`${p.day}-l`} x1={px} y1={py} x2={x} y2={y} stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" />;
                                })}
                                {progressionSeries.points.map((p, i, arr) => {
                                  const x = (i / (arr.length - 1)) * 300;
                                  const y = 80 - (((p.bestEst1rm - progressionSeries.min) / ((progressionSeries.max - progressionSeries.min) || 1)) * 60 + 10);
                                  return <circle key={`${p.day}-c`} cx={x} cy={y} r={i === arr.length - 1 ? 4 : 2} fill="var(--lime)" />;
                                })}
                              </svg>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-mute)", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                                <span>{progressionSeries.min.toFixed(1)}</span>
                                <span>{progressionSeries.max.toFixed(1)}</span>
                              </div>
                            </div>
                          )}

                          {(() => {
                            const last = progressionSeries.points[progressionSeries.points.length - 1];
                            return (
                              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 10 }}>
                                Último ({last.day}): {last.bestWeight}kg x {last.bestReps} {" · "} e1RM {last.bestEst1rm.toFixed(1)}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </div>

              <div style={{ padding: "0 20px" }}>
                <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
                  Últimas sesiones
                </div>
                {sessions.length === 0 ? (
                  <StateBlock kind="empty" title="Sin sesiones" body="Cuando completes entrenamientos van a aparecer acá." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sessions.slice(0, 30).map((s) => (
                      <div key={s.id} style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                            {s.workoutTemplate?.title ?? "Sesión libre"}
                          </div>
                          <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                            {new Date(s.performedAt).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                          </div>
                        </div>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                          {s.status} {" · "} {s.setsCount} sets {" · "} {s.totalVolumeKg.toLocaleString("es")} kg
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
