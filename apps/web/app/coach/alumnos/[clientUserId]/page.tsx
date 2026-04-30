"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Badge, Button, Card, ConfirmModal, Icon, Progress, StateBlock, Tabs } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { SessionSummary } from "@regen/types";

interface PlanOption { id: string; title: string; weeksCount: number }

function AssignPlanModal({
  clientUserId,
  currentPlanId,
  onClose,
  onAssigned,
}: {
  clientUserId: string;
  currentPlanId?: string;
  onClose: () => void;
  onAssigned: (planId: string, planTitle: string, weeksCount: number) => void;
}) {
  const { api } = useAuth();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selected, setSelected] = useState(currentPlanId ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ id: string; title: string; weeksCount: number }[]>("/coach/plans")
      .then(setPlans)
      .catch(console.error);
  }, [api]);

  async function handleAssign() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/coach/clients/${clientUserId}`, { planId: selected, startDate });
      const plan = plans.find((p) => p.id === selected)!;
      onAssigned(selected, plan.title, plan.weeksCount);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440,
          background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 16, padding: 28,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 20 }}>
          Asignar plan
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Plan</label>
          <div style={{ padding: "0 12px", height: 44, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center" }}>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: selected ? "var(--text)" : "var(--text-mute)" }}
            >
              <option value="">Seleccionar plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.title} · {p.weeksCount} sem</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Fecha de inicio</label>
          <div style={{ padding: "0 12px", height: 44, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center" }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
            />
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={onClose} disabled={saving} style={{ flex: 1 }}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={saving || !selected} style={{ flex: 1 }}>
            {saving ? "Asignando…" : "Asignar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ClientDetail {
  id: string;
  name: string | null;
  email: string;
  assignment: {
    status: string;
    plan: { id: string; title: string; weeksCount: number } | null;
    weekNumber?: number;
  } | null;
  recentSessions: SessionSummary[];
  weightHistory: { recordedAt: string; weight: number }[];
}

interface ApiClientResponse {
  client: { id: string; name: string | null; email: string; assignment: ClientDetail["assignment"] };
  recentSessions: SessionSummary[];
  weightHistory: { measuredAt: string; weightKg: string | null }[];
}

function daysSince(iso: string): number {
  return Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86400000);
}

function fmtSleep(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export default function AthleteDetailPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { clientUserId } = useParams<{ clientUserId: string }>();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Historial");
  const [health, setHealth] = useState<{
    entries: Array<{
      id: string;
      day: string;
      steps: number | null;
      sleepMinutes: number | null;
      sportType: string | null;
      sportMinutes: number | null;
      notes: string | null;
    }>;
    metrics: Array<{
      id: string;
      measuredAt: string;
      weightKg: string | null;
      waistCm: string | null;
      chestCm: string | null;
      hipsCm: string | null;
      armCm: string | null;
      thighCm: string | null;
      notes: string | null;
    }>;
    coachNotes: Array<{
      id: string;
      day: string;
      text: string;
      createdAt: string;
      coach: { id: string; name: string };
    }>;
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [food, setFood] = useState<
    Array<{
      id: string;
      loggedAt: string;
      text: string | null;
      photoUrl: string | null;
      source: string;
      coachComments: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string | null } }>;
    }> | null
  >(null);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodCommentDrafts, setFoodCommentDrafts] = useState<Record<string, string>>({});

  const [goals, setGoals] = useState<
    Array<{
      id: string;
      kind: string;
      targetInt: number | null;
      targetNumber: string | null;
      unit: string;
      period: string;
      startDate: string;
      endDate: string | null;
      createdAt: string;
    }> | null
  >(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalKind, setGoalKind] = useState("steps_daily");
  const [goalTarget, setGoalTarget] = useState("");

  const [summary, setSummary] = useState<{
    range: { start: string; end: string; days: number };
    health: { daysWithEntry: number; stepsTotal: number; sleepAvgMinutes: number | null; sportMinutesTotal: number };
    food: { count: number };
    workouts: { total: number; completed: number };
    latestWeight: { measuredAt: string; weightKg: string } | null;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [noteDay, setNoteDay] = useState(new Date().toISOString().slice(0, 10));
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const notesForDay = useMemo(() => {
    const all = health?.coachNotes ?? [];
    return all.filter((n) => n.day === noteDay).slice(0, 5);
  }, [health?.coachNotes, noteDay]);

  async function loadHealthData(force?: boolean) {
    if (!force && (healthLoading || health)) return;
    setHealthLoading(true);
    try {
      const r = await api.get<{ entries: any[]; metrics: any[]; coachNotes: any[] }>(
        `/coach/clients/${clientUserId}/health?take=30`,
      );
      setHealth({
        entries: (r.entries ?? []).map((e) => ({
          id: e.id,
          day: String(e.day).slice(0, 10),
          steps: e.steps ?? null,
          sleepMinutes: e.sleepMinutes ?? null,
          sportType: e.sportType ?? null,
          sportMinutes: e.sportMinutes ?? null,
          notes: e.notes ?? null,
        })),
        metrics: (r.metrics ?? []).map((m) => ({
          id: m.id,
          measuredAt: String(m.measuredAt),
          weightKg: m.weightKg ?? null,
          waistCm: m.waistCm ?? null,
          chestCm: m.chestCm ?? null,
          hipsCm: m.hipsCm ?? null,
          armCm: m.armCm ?? null,
          thighCm: m.thighCm ?? null,
          notes: m.notes ?? null,
        })),
        coachNotes: (r.coachNotes ?? []).map((n) => ({
          id: n.id,
          day: String(n.day).slice(0, 10),
          text: n.text,
          createdAt: String(n.createdAt),
          coach: n.coach,
        })),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadFoodData(force?: boolean) {
    if (!force && (foodLoading || food)) return;
    setFoodLoading(true);
    try {
      const r = await api.get<{
        items: Array<{
          id: string;
          loggedAt: string;
          text: string | null;
          photoUrl: string | null;
          source: string;
          coachComments: Array<{ id: string; text: string; createdAt: string; coach: { id: string; name: string | null } }>;
        }>;
      }>(`/coach/clients/${clientUserId}/food?take=30`);
      setFood(r.items ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setFoodLoading(false);
    }
  }

  async function loadGoalsData(force?: boolean) {
    if (!force && (goalsLoading || goals)) return;
    setGoalsLoading(true);
    try {
      const r = await api.get<{
        goals: Array<{
          id: string;
          kind: string;
          targetInt: number | null;
          targetNumber: string | null;
          unit: string;
          period: string;
          startDate: string;
          endDate: string | null;
          createdAt: string;
        }>;
      }>(`/coach/clients/${clientUserId}/goals`);
      setGoals(r.goals ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setGoalsLoading(false);
    }
  }

  async function loadSummaryData(force?: boolean) {
    if (!force && (summaryLoading || summary)) return;
    setSummaryLoading(true);
    try {
      const r = await api.get<{
        range: { start: string; end: string; days: number };
        health: { daysWithEntry: number; stepsTotal: number; sleepAvgMinutes: number | null; sportMinutesTotal: number };
        food: { count: number };
        workouts: { total: number; completed: number };
        latestWeight: { measuredAt: string; weightKg: string } | null;
      }>(`/coach/clients/${clientUserId}/summary/week?days=7`);
      setSummary(r);
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  }

  function goalMeta(kind: string) {
    if (kind === "steps_daily") return { unit: "steps", period: "daily", placeholder: "8000" };
    if (kind === "sleep_daily") return { unit: "minutes", period: "daily", placeholder: "7.5" };
    if (kind === "workouts_weekly") return { unit: "sessions", period: "weekly", placeholder: "3" };
    return { unit: "count", period: "daily", placeholder: "0" };
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
        kind: goalKind,
        targetInt,
        unit: meta.unit,
        period: meta.period,
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

  async function postFoodComment(foodId: string) {
    const text = (foodCommentDrafts[foodId] ?? "").trim();
    if (!text) return;
    try {
      await api.post(`/coach/clients/${clientUserId}/food/${foodId}/comments`, { text });
      setFoodCommentDrafts((prev) => ({ ...prev, [foodId]: "" }));
      await loadFoodData(true);
      toast.success("Comentario enviado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error enviando comentario");
    }
  }

  function handleTabChange(next: string) {
    setTab(next);
    if (next === "Salud" || next === "Métricas") {
      loadHealthData(false);
    }
    if (next === "Salud") {
      loadFoodData(false);
      loadGoalsData(false);
      loadSummaryData(false);
    }
  }
  const [showAssign, setShowAssign] = useState(false);
  const [removingPlan, setRemovingPlan] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    api
      .get<ApiClientResponse>(`/coach/clients/${clientUserId}`)
      .then((data) => {
        setClient({
          ...data.client,
          recentSessions: data.recentSessions,
          weightHistory: data.weightHistory.map((w) => ({
            recordedAt: w.measuredAt,
            weight: w.weightKg ? parseFloat(w.weightKg) : 0,
          })),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, clientUserId]);

  if (loading) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="loading" title="Cargando alumno…" />
      </DesktopShell>
    );
  }

  if (!client) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="error" title="Alumno no encontrado" />
      </DesktopShell>
    );
  }

  const name = client.name ?? client.email;
  const sessions = client.recentSessions ?? [];
  const completed = sessions.filter((s) => s.status === "completed");

  const weightData = client.weightHistory ?? [];
  const latestWeight = weightData[0]?.weight;
  const prevWeight = weightData[1]?.weight;
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
  <>
    <DesktopShell
      active="athletes"
      title={
        <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
          Alumnos{" "}
          <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>{name}</span>
        </span>
      }
      subtitle={`${client.email}${client.assignment?.plan ? ` · ${client.assignment.plan.title}` : ""}`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            icon="chevL"
            onClick={() => router.push("/coach/alumnos")}
          >
            Volver
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon="calendar"
            onClick={() => setShowAssign(true)}
          >
            {client.assignment?.plan ? "Cambiar plan" : "Asignar plan"}
          </Button>
          {client.assignment?.plan && (
            <Button
              variant="outline"
              size="sm"
              icon="edit"
              onClick={() => router.push(`/coach/planes/${client.assignment!.plan!.id}`)}
            >
              Ver plan
            </Button>
          )}
          {client.assignment?.plan && (
            <Button
              variant="outline"
              size="sm"
              disabled={removingPlan}
              onClick={() => setConfirmDialog({
                message: "¿Quitar el plan activo de este alumno?",
                onConfirm: async () => {
                  setConfirmDialog(null);
                  setRemovingPlan(true);
                  try {
                    await api.patch(`/coach/clients/${clientUserId}`, { planStatus: "finished" });
                    setClient((prev) => prev ? { ...prev, assignment: null } : prev);
                    toast.success("Plan quitado");
                  } catch {
                    toast.error("No se pudo quitar el plan");
                    setRemovingPlan(false);
                  }
                },
              })}
              style={{ color: "var(--warn)", borderColor: "var(--warn)" }}
            >
              {removingPlan ? "Quitando…" : "Quitar plan"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={unlinking}
            onClick={() => setConfirmDialog({
              message: `¿Desvincular a ${client.name ?? client.email}? Perderás acceso a sus datos.`,
              onConfirm: async () => {
                setConfirmDialog(null);
                setUnlinking(true);
                try {
                  await api.del(`/coach/clients/${clientUserId}`);
                  router.replace("/coach/alumnos");
                } catch {
                  setUnlinking(false);
                }
              },
            })}
            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
          >
            {unlinking ? "Desvinculando…" : "Desvincular"}
          </Button>
        </>
      }
    >
      <div className="coach-pad" style={{ paddingTop: 0, paddingBottom: 0 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            gap: 20,
            padding: "20px 0 24px",
            borderBottom: "1px solid var(--line)",
            alignItems: "center",
          }}
        >
          <Avatar name={name} size={72} tone="var(--lime)" textColor="#0B0B0C" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{name}</div>
              {client.assignment?.status === "active" ? (
                <Badge tone="success">Activo</Badge>
              ) : (
                <Badge tone="neutral">Sin plan</Badge>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 3 }}>
              {client.email}
            </div>
            {client.assignment?.plan && (
              <div style={{ marginTop: 8 }}>
                <Badge tone="neutral">{client.assignment.plan.title}</Badge>
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              paddingLeft: 24,
              borderLeft: "1px solid var(--line)",
            }}
          >
            {[
              { l: "Sesiones", v: String(completed.length) },
              {
                l: "Última",
                v:
                  sessions[0]
                    ? `Hace ${daysSince(sessions[0].performedAt)}d`
                    : "—",
              },
              { l: "Peso actual", v: latestWeight ? `${latestWeight}kg` : "—" },
            ].map((m) => (
              <div key={m.l}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontWeight: 600,
                  }}
                >
                  {m.l}
                </div>
                <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, padding: "18px 0 0" }}>
          <Tabs
            tabs={["Historial", "Salud", "Métricas"]}
            active={tab}
            onChange={handleTabChange}
          />
        </div>

        <div
          className="coach-two-col"
          style={{ padding: "18px 0 28px" }}
        >
          {tab === "Historial" ? (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>Sesiones recientes</div>
              </div>

              {sessions.length === 0 ? (
                <StateBlock kind="empty" title="Sin sesiones" body="Este alumno aún no completó ninguna sesión." />
              ) : (
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 8,
                      top: 8,
                      bottom: 8,
                      width: 1,
                      background: "var(--line)",
                    }}
                  />
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        gap: 14,
                        marginBottom: 10,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: -20,
                          top: 14,
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          background:
                            s.status === "completed" ? "var(--lime)" : "var(--bg-2)",
                          border: `2px solid ${s.status === "completed" ? "var(--lime)" : "var(--line-2)"}`,
                        }}
                      />
                      <div
                        onClick={() =>
                          router.push(
                            `/coach/alumnos/${clientUserId}/sesiones/${s.id}`
                          )
                        }
                        style={{
                          flex: 1,
                          padding: 12,
                          background: "var(--bg-1)",
                          border: "1px solid var(--line)",
                          borderRadius: 10,
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                        className="ta-row"
                      >
                        <div
                          className="ta-mono"
                          style={{ fontSize: 11, color: "var(--text-mute)", width: 64 }}
                        >
                          {new Date(s.performedAt).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>
                            {s.workoutTemplate?.title ?? "Sesión libre"}
                          </div>
                          {s.status === "completed" && (
                            <div
                              className="ta-mono"
                              style={{
                                fontSize: 11,
                                color: "var(--text-mute)",
                                marginTop: 2,
                              }}
                            >
                              {s.setsCount} series
                            </div>
                          )}
                        </div>
                        <Icon name="chevR" size={14} color="var(--text-mute)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "Salud" ? (
            <div>
              <Card style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="chart" size={16} color="var(--text-mute)" />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Resumen (7 días)</div>
                  </div>
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                    {summary?.range ? `${summary.range.start} → ${summary.range.end}` : summaryLoading ? "…" : "—"}
                  </div>
                </div>
                {summaryLoading || !summary ? (
                  <div style={{ marginTop: 8 }}>
                    <StateBlock kind="loading" title="Cargando resumen…" />
                  </div>
                ) : (
                  <div className="ta-mono" style={{ marginTop: 10, fontSize: 12, color: "var(--text-mute)" }}>
                    Pasos: {summary.health.stepsTotal.toLocaleString("es")} {" · "} Sueño prom: {fmtSleep(summary.health.sleepAvgMinutes)} {" · "} Deporte: {summary.health.sportMinutesTotal}m
                    {" · "} Comidas: {summary.food.count} {" · "} Entrenos: {summary.workouts.completed}/{summary.workouts.total}
                    {summary.latestWeight ? ` · Peso: ${parseFloat(summary.latestWeight.weightKg).toFixed(1)}kg (${summary.latestWeight.measuredAt})` : ""}
                  </div>
                )}
              </Card>

              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Salud diaria</div>
              {healthLoading || !health ? (
                <StateBlock kind="loading" title="Cargando salud…" />
              ) : health.entries.length === 0 ? (
                <StateBlock kind="empty" title="Sin registros" body="El alumno aún no cargó salud diaria." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {health.entries.slice(0, 14).map((e) => (
                    <div
                      key={e.id}
                      onClick={() => setNoteDay(e.day)}
                      style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, cursor: "pointer" }}
                      className="ta-row"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                          {new Date(e.day).toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })}
                        </div>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                          {e.steps != null ? `${e.steps.toLocaleString("es")} pasos` : "—"} {" · "} {fmtSleep(e.sleepMinutes)}
                        </div>
                      </div>
                      {e.sportType || e.sportMinutes ? (
                        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 6 }}>
                          {e.sportType ?? "Deporte"}{e.sportMinutes ? ` · ${e.sportMinutes}m` : ""}
                        </div>
                      ) : null}
                      {e.notes ? (
                        <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6, whiteSpace: "pre-wrap" }}>
                          {e.notes}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 600, margin: "18px 0 10px" }}>Comidas</div>
              {foodLoading || food === null ? (
                <StateBlock kind="loading" title="Cargando comidas…" />
              ) : food.length === 0 ? (
                <StateBlock kind="empty" title="Sin comidas" body="El alumno aún no registró comidas." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {food.slice(0, 20).map((f) => (
                    <div key={f.id} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                          {new Date(f.loggedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {f.source && f.source !== "manual" ? <Badge tone="info">EXTERNAL</Badge> : <Badge tone="neutral">MANUAL</Badge>}
                          {f.photoUrl ? (
                            <a href={f.photoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--lime-high)", fontWeight: 700 }}>
                              Ver foto
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-start" }}>
                        {f.photoUrl ? (
                          <Image
                            src={f.photoUrl}
                            alt=""
                            width={54}
                            height={54}
                            style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }}
                          />
                        ) : null}
                        {f.text ? (
                          <div style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap" }}>{f.text}</div>
                        ) : (
                          <div style={{ fontSize: 13, color: "var(--text-mute)" }}>—</div>
                        )}
                      </div>

                      {f.coachComments?.length ? (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                          <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                            Comentarios
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

                      <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                        <input
                          value={foodCommentDrafts[f.id] ?? ""}
                          onChange={(e) => setFoodCommentDrafts((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder="Comentario del coach…"
                          style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                        />
                        <Button size="sm" icon="send" disabled={!String(foodCommentDrafts[f.id] ?? "").trim()} onClick={() => postFoodComment(f.id)}>
                          Enviar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 600, margin: "18px 0 10px" }}>Metas</div>
              {goalsLoading || goals === null ? (
                <StateBlock kind="loading" title="Cargando metas…" />
              ) : (
                <>
                  {goals.length === 0 ? (
                    <StateBlock kind="empty" title="Sin metas" body="Todavía no definiste metas para este alumno." />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                      {goals.slice(0, 8).map((g) => (
                        <div key={g.id} style={{ padding: 10, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Badge tone="neutral" icon="star">{g.kind}</Badge>
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
                        placeholder={goalMeta(goalKind).placeholder}
                        style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <Button disabled={!goalTarget.trim()} icon="plus" onClick={addGoal}>Agregar meta</Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Métricas</div>
              {healthLoading || !health ? (
                <StateBlock kind="loading" title="Cargando métricas…" />
              ) : health.metrics.length === 0 ? (
                <StateBlock kind="empty" title="Sin mediciones" body="El alumno aún no registró métricas." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {health.metrics.slice(0, 20).map((m) => (
                    <div key={m.id} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                          {new Date(m.measuredAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="ta-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
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
          )}

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tab === "Salud" && (
              <Card pad={16}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Nota del coach</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                  <input
                    type="date"
                    value={noteDay}
                    onChange={(e) => setNoteDay(e.target.value)}
                    style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)", width: 160 }}
                  />
                  <Button
                    size="sm"
                    disabled={savingNote || !noteText.trim()}
                    onClick={async () => {
                      setSavingNote(true);
                      try {
                        await api.post(`/coach/clients/${clientUserId}/health`, { day: noteDay, text: noteText.trim() });
                        setNoteText("");
                        await loadHealthData(true);
                      } finally {
                        setSavingNote(false);
                      }
                    }}
                  >
                    {savingNote ? "Guardando…" : "Guardar"}
                  </Button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  placeholder="Feedback, ajustes, observaciones…"
                  style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 12, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }}
                />

                {notesForDay.length ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                      Notas ({notesForDay.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {notesForDay.map((n) => (
                        <div key={n.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)" }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{n.coach.name}</div>
                          <div style={{ fontSize: 13, marginTop: 2, whiteSpace: "pre-wrap" }}>{n.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            )}
            {client.assignment?.plan && (
              <Card pad={16}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Plan activo</div>
                  {client.assignment.weekNumber != null && (
                    <Badge tone="limeSoft">
                      S{client.assignment.weekNumber}/{client.assignment.plan.weeksCount}
                    </Badge>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "-.01em",
                  }}
                >
                  {client.assignment.plan.title}
                </div>
                {client.assignment.weekNumber != null && (
                  <>
                    <Progress
                      value={client.assignment.weekNumber}
                      total={client.assignment.plan.weeksCount}
                      style={{ marginTop: 14 }}
                    />
                    <div
                      className="ta-mono"
                      style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}
                    >
                      Semana {client.assignment.weekNumber} de{" "}
                      {client.assignment.plan.weeksCount}
                    </div>
                  </>
                )}
              </Card>
            )}

            {weightData.length > 0 && (
              <Card pad={16}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Peso corporal
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <span className="ta-mono" style={{ fontSize: 24, fontWeight: 600 }}>
                    {latestWeight}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-mute)" }}>kg</span>
                  {weightDiff && (
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          Number(weightDiff) < 0 ? "var(--danger)" : "var(--success)",
                        marginLeft: 4,
                      }}
                    >
                      {Number(weightDiff) > 0 ? "+" : ""}
                      {weightDiff}kg
                    </span>
                  )}
                </div>
                {weightData.length > 1 && (
                  <svg
                    width="100%"
                    height="48"
                    viewBox="0 0 200 48"
                    style={{ marginTop: 10 }}
                    preserveAspectRatio="none"
                  >
                    {weightData
                      .slice(0, 10)
                      .reverse()
                      .map((w, i, arr) => {
                        const min = Math.min(...arr.map((x) => x.weight));
                        const max = Math.max(...arr.map((x) => x.weight));
                        const range = max - min || 1;
                        const x = (i / (arr.length - 1)) * 200;
                        const y = 48 - (((w.weight - min) / range) * 32 + 8);
                        if (i === 0) return null;
                        const px =
                          ((i - 1) / (arr.length - 1)) * 200;
                        const py =
                          48 -
                          (((arr[i - 1].weight - min) / range) * 32 + 8);
                        return (
                          <line
                            key={i}
                            x1={px}
                            y1={py}
                            x2={x}
                            y2={y}
                            stroke="var(--lime)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        );
                      })}
                  </svg>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DesktopShell>

    {showAssign && (
      <AssignPlanModal
        clientUserId={clientUserId}
        currentPlanId={client.assignment?.plan?.id}
        onClose={() => setShowAssign(false)}
        onAssigned={(planId, planTitle, weeksCount) => {
          setClient((prev) => prev ? {
            ...prev,
            assignment: { status: "active", plan: { id: planId, title: planTitle, weeksCount } },
          } : prev);
          toast.success(`Plan "${planTitle}" asignado`);
        }}
      />
    )}
    {confirmDialog && (
      <ConfirmModal
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
  </>
  );
}
