"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, Card, Icon, KPI, Skeleton, StateBlock } from "@/components/ui";
import { fmtSleep, goalLabel, goalBadge, addDaysUTC } from "./_types";
import { DailyForm } from "./daily-form";
import type { HealthEntry, MetricEntry, WeeklySummary, SessionItem, HealthGoal } from "./_types";
import type { ActivitySummary } from "@regen/types";

type Props = {
  health: HealthEntry[] | null;
  metrics: MetricEntry[] | null;
  sessions: SessionItem[] | null;
  summary: WeeklySummary | null;
  activity30: ActivitySummary | null;
  goals: HealthGoal[] | null;
  onHealthLoadRef: React.MutableRefObject<((entries: HealthEntry[]) => void) | null>;
  loadHealth: () => void;
  loadGoals: () => void;
  loadSummary: () => void;
};

export function DashboardTab({
  health,
  metrics,
  sessions,
  summary,
  activity30,
  goals,
  onHealthLoadRef,
  loadHealth,
  loadGoals,
  loadSummary,
}: Props) {
  const { api } = useAuth();
  const toast = useToast();

  const [goalKind, setGoalKind] = useState("steps_daily");
  const [goalTarget, setGoalTarget] = useState("");

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

  function goalMeta() {
    if (goalKind === "steps_daily") return { unit: "steps", period: "daily", placeholder: "8000" };
    if (goalKind === "sleep_daily") return { unit: "minutes", period: "daily", placeholder: "7.5" };
    if (goalKind === "workouts_weekly") return { unit: "sessions", period: "weekly", placeholder: "3" };
    return { unit: "count", period: "daily", placeholder: "0" };
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
        kind: goalKind, targetInt, unit: meta.unit, period: meta.period, startDate: todayIso,
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

  const labelStyle = { fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase" as const, letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 };

  return (
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
                  <Skeleton width={80} height={18} />
                </div>
              ))}
            </div>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
                  <Skeleton width={70} height={18} />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6, marginTop: 4 }}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <Skeleton key={i} height={14} borderRadius={4} />
                ))}
              </div>
            </div>
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
                      <div key={d.day} title={d.day} style={{ height: 14, borderRadius: 4, background: d.active ? "var(--lime)" : "var(--bg-2)", border: `1px solid ${d.active ? "var(--lime)" : "var(--line)"}` }} />
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
            <div>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ padding: 10, background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Skeleton width={120} height={14} />
                    <Skeleton width={60} height={12} />
                  </div>
                </div>
              ))}
            </div>
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
                  <div style={labelStyle}>Tipo</div>
                  <select value={goalKind} onChange={(e) => setGoalKind(e.target.value)} style={{ width: "100%", background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}>
                    <option value="steps_daily">Pasos diarios</option>
                    <option value="sleep_daily">Sueño diario</option>
                    <option value="workouts_weekly">Entrenos semanales</option>
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Objetivo</div>
                  <input value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder={goalMeta().placeholder} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }} />
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
              <div style={{ marginTop: 10 }}><Button variant="outline" block disabled icon="lock">Conectar</Button></div>
            </div>
            <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Google Fit</div>
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>Android</div>
              <div style={{ marginTop: 10 }}><Button variant="outline" block disabled icon="lock">Conectar</Button></div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <DailyForm health={health} onHealthLoadRef={onHealthLoadRef} loadHealth={loadHealth} />
      </div>
    </>
  );
}
