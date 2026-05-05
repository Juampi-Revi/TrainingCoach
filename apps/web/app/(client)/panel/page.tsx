"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { ClientDashboard } from "@regen/types";
import {
  ScoreHeader,
  QuickLogStrip,
  MetricCard,
  DotProgress,
  MiniBars,
  SleepRing,
  EnergyBars,
  NutritionStack,
  WeekHeatmap,
  MonthSummary,
  QuickHealthModal,
} from "./_components";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weekLabel(weekStart: string): string {
  const s = new Date(weekStart);
  const e = new Date(s.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return `${fmt(s)} – ${fmt(e)}`;
}

function fmtSleepH(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function calculateTrend(dailySteps: (number | null)[]): string | undefined {
  const validSteps = dailySteps.filter((s): s is number => s !== null);
  if (validSteps.length < 6) return undefined;

  const firstHalf = validSteps.slice(0, Math.floor(validSteps.length / 2));
  const secondHalf = validSteps.slice(Math.floor(validSteps.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (avgFirst === 0) return undefined;

  const pct = ((avgSecond - avgFirst) / avgFirst) * 100;
  return `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayData {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  energyRating: number | null;
  workoutsToday: number;
  food: Array<{
    id: string;
    loggedAt: string;
    mealType: "breakfast" | "lunch" | "dinner" | "snack" | null;
    quality: "good" | "regular" | "poor" | null;
    text: string | null;
  }>;
}

interface HealthGoal {
  id: string;
  kind: string;
  targetInt: number | null;
  targetNumber: string | null;
  unit: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PanelPage() {
  const router = useRouter();
  const { api } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<ClientDashboard | null>(null);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<"steps" | "sleep" | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get<ClientDashboard>("/client/dashboard");
      setData(res);
    } catch {
      // silent
    }
  }, [api]);

  const loadToday = useCallback(async () => {
    try {
      const res = await api.get<TodayData>("/client/today");
      setTodayData(res);
    } catch {
      // silent
    }
  }, [api]);

  const loadGoals = useCallback(async () => {
    try {
      const res = await api.get<{ goals: HealthGoal[] }>("/client/goals");
      setGoals(res.goals || []);
    } catch {
      // silent
    }
  }, [api]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDashboard(), loadToday(), loadGoals()]);
    setLoading(false);
  }, [loadDashboard, loadToday, loadGoals]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSaveSteps(data: { date: string; value: number }) {
    try {
      await api.post("/client/health", {
        day: data.date,
        steps: data.value,
      });
      toast.success("Pasos registrados");
      loadToday();
      loadDashboard();
    } catch (e) {
      toast.error("Error al guardar");
      throw e;
    }
  }

  async function handleSaveSleep(data: { date: string; value: number }) {
    try {
      await api.post("/client/health", {
        day: data.date,
        sleepMinutes: Math.round(data.value * 60),
      });
      toast.success("Sueño registrado");
      loadToday();
      loadDashboard();
    } catch (e) {
      toast.error("Error al guardar");
      throw e;
    }
  }

  if (loading) {
    return (
      <div className="panel-page">
        <div className="panel-loading">
          <div style={{ color: "var(--text-mute)", fontSize: 13 }}>
            Cargando panel…
          </div>
        </div>
      </div>
    );
  }

  const d = data;
  const totalTarget = d?.workoutsTarget ?? 4;
  const strengthTarget = d?.strengthTarget ?? Math.ceil(totalTarget / 2);
  const cardioTarget = d?.cardioTarget ?? Math.floor(totalTarget / 2);

  // Calculate fractions for activity rings
  const workoutFraction = totalTarget > 0 ? (d?.workoutsCompleted ?? 0) / totalTarget : 0;
  const stepsFraction = d?.stepsAvg ? Math.min(1, d.stepsAvg / 10000) : 0;
  const sleepFraction = d?.sleepMinutesAvg ? Math.min(1, d.sleepMinutesAvg / (8 * 60)) : 0;

  // Food count for badge
  const foodCount = (d?.foodGood ?? 0) + (d?.foodRegular ?? 0) + (d?.foodPoor ?? 0);

  // Data processing for cards
  const stepsK = d?.stepsAvg ? Math.round(d.stepsAvg / 100) / 10 : null;
  const dailyStepsK = d?.dailySteps.map((s) => (s !== null ? Math.round(s / 100) / 10 : null)) ?? [];
  const trend = calculateTrend(d?.dailySteps ?? []);
  const sleepHours = d?.sleepMinutesAvg ? d.sleepMinutesAvg / 60 : null;

  // Goals for heatmap
  const stepsGoal = goals.find((g) => g.kind === "steps")?.targetInt ?? 8000;
  const sleepGoalMinutes = goals.find((g) => g.kind === "sleep")?.targetInt ?? 480;

  return (
    <div className="panel-page">
      {/* Header Section */}
      <div className="panel-header">
        <div className="panel-title">Mi Panel</div>
        <div className="panel-subtitle">
          {d && (
            <>
              Semana {d.weekNumber} de {d.totalWeeks} · {weekLabel(d.weekStart)}
            </>
          )}
        </div>
      </div>

      {/* Score Section */}
      <div className="panel-section panel-section-score">
        {d && (
          <ScoreHeader
            weekNumber={d.weekNumber}
            totalWeeks={d.totalWeeks}
            weekScore={d.weekScore}
            previousWeekScore={d.previousWeekScore}
            workoutFraction={workoutFraction}
            stepsFraction={stepsFraction}
            sleepFraction={sleepFraction}
          />
        )}
      </div>

      {/* Quick Log Section */}
      <div className="panel-section">
        {d && todayData && (
          <QuickLogStrip
            workoutsCompleted={d.workoutsCompleted}
            workoutsTarget={d.workoutsTarget}
            foodCount={todayData.food.length}
            stepsCount={todayData.steps}
            sleepMinutes={todayData.sleepMinutes}
            onLogFood={() => router.push("/comida")}
            onLogSteps={() => setModalOpen("steps")}
            onLogSleep={() => setModalOpen("sleep")}
          />
        )}
      </div>

      {/* Stats Grid Section - 4 métricas principales */}
      <div className="panel-section">
        <div className="stats-grid-main">
          {/* FUERZA */}
          {d && (
            <MetricCard
              label="FUERZA"
              value={String(d.strengthCompleted)}
              sub={`de ${strengthTarget} esta sem`}
              accent="var(--lime)"
            >
              <DotProgress count={strengthTarget} done={d.strengthCompleted} color="var(--lime)" />
            </MetricCard>
          )}

          {/* AERÓBICO */}
          {d && (
            <MetricCard
              label="AERÓBICO"
              value={String(d.cardioCompleted)}
              sub={`de ${cardioTarget} esta sem`}
              accent="#7AB8FF"
            >
              <DotProgress count={cardioTarget} done={d.cardioCompleted} color="#7AB8FF" />
            </MetricCard>
          )}

          {/* PASOS */}
          {d && (
            <MetricCard
              label="PASOS · 7D"
              value={stepsK !== null ? stepsK.toFixed(1).replace(".", ",") + "k" : "—"}
              sub={stepsK !== null ? "prom diario · meta 8k" : "no registrado"}
              trend={trend}
              accent="var(--lime)"
            >
              <MiniBars data={dailyStepsK} target={8} color="var(--lime)" unit="k" />
            </MetricCard>
          )}

          {/* SUEÑO */}
          {d && (
            <MetricCard
              label="SUEÑO"
              value={sleepHours !== null ? fmtSleepH(sleepHours) : "—"}
              sub={sleepHours !== null ? "prom · meta 8h" : "no registrado"}
              accent="#A78BFA"
            >
              {sleepHours !== null && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <SleepRing hours={sleepHours} targetHours={8} size={40} />
                </div>
              )}
            </MetricCard>
          )}
        </div>
      </div>

      {/* Secondary Stats Section - Energía y Nutrición */}
      <div className="panel-section">
        <div className="stats-grid-secondary">
          {/* ENERGÍA */}
          {d && (
            <div className="secondary-card">
              <div className="secondary-label">ENERGÍA · DIARIA</div>
              <div className="secondary-content">
                <div className="secondary-value-row">
                  <span className="secondary-value" style={{ color: "#7AB8FF" }}>
                    {d.energyAvg !== null ? d.energyAvg.toFixed(1).replace(".", ",") : "—"}
                  </span>
                  <span className="secondary-unit">/ 5</span>
                </div>
                <div className="secondary-sub">
                  {d.energyAvg !== null ? "promedio 7 días" : "sin datos"}
                </div>
                <div style={{ marginTop: 16 }}>
                  <EnergyBars data={d.dailyEnergy} />
                </div>
              </div>
            </div>
          )}

          {/* NUTRICIÓN */}
          {d && (
            <div className="secondary-card">
              <div className="secondary-label">NUTRICIÓN · 7D</div>
              <div className="secondary-content">
                <NutritionStack good={d.foodGood} regular={d.foodRegular} poor={d.foodPoor} />
                <button onClick={() => router.push("/comida")} className="nutrition-add-btn">
                  + Registrar comida
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week Heatmap + Month Summary Section */}
      <div className="panel-section">
        <div className="heatmap-summary-grid">
          {d && (
            <>
              <WeekHeatmap
                weekStart={d.weekStart}
                dailySteps={d.dailySteps}
                dailySleepMinutes={d.dailySleepMinutes}
                dailyWorkouts={d.dailyWorkouts}
                goals={{ steps: stepsGoal, sleepMinutes: sleepGoalMinutes }}
              />
              <MonthSummary
                activeDays={d.dailySteps.filter(s => s !== null && s > 0).length}
                totalDays={d.dailySteps.length}
                stepsTotal={d.dailySteps.reduce((a: number, b) => a + (b || 0), 0)}
                sleepAvgMinutes={(() => {
                  const sleepValues = d.dailySleepMinutes.filter((s): s is number => s !== null);
                  return sleepValues.length > 0 
                    ? Math.round(sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length)
                    : 0;
                })()}
                workoutsTotal={d.dailyWorkouts.reduce((a: number, b) => a + b, 0)}
              />
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuickHealthModal
        type="steps"
        isOpen={modalOpen === "steps"}
        onClose={() => setModalOpen(null)}
        onSave={handleSaveSteps}
        currentValue={todayData?.steps}
      />

      <QuickHealthModal
        type="sleep"
        isOpen={modalOpen === "sleep"}
        onClose={() => setModalOpen(null)}
        onSave={handleSaveSleep}
        currentValue={todayData?.sleepMinutes}
      />

      <style jsx>{`
        .panel-page {
          min-height: 100dvh;
          background: var(--bg);
          padding-bottom: calc(100px + env(safe-area-inset-bottom));
        }

        .panel-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }

        /* Mobile first */
        .panel-header {
          padding: 20px 16px 16px;
        }

        .panel-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .panel-subtitle {
          font-size: 12px;
          color: var(--text-mute);
          margin-top: 4px;
        }

        .panel-section {
          padding: 0 16px 16px;
        }

        /* Más espacio para el score */
        .panel-section-score {
          padding-top: 8px;
        }

        /* Grid principal - 4 métricas (Fuerza, Aeróbico, Pasos, Sueño) */
        .stats-grid-main {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        /* Grid secundario - Energía y Nutrición (más anchas, debajo) */
        .stats-grid-secondary {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        /* Grid heatmap + month summary */
        .heatmap-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        /* Secondary cards styling */
        .secondary-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .secondary-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .secondary-content {
          flex: 1;
        }

        .secondary-value-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .secondary-value {
          font-family: var(--font-mono);
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .secondary-unit {
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--text-mute);
        }

        .secondary-sub {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-mute);
          margin-top: 4px;
        }

        .nutrition-add-btn {
          margin-top: 16px;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px dashed var(--line-2);
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-mute);
          font-weight: 600;
          transition: border-color 0.2s, color 0.2s;
        }

        .nutrition-add-btn:hover {
          border-color: var(--lime);
          color: var(--lime);
        }

        /* Desktop - Full width */
        @media (min-width: 768px) {
          .panel-page {
            padding-bottom: 32px;
          }

          .panel-header {
            padding: 48px 28px 24px;
            border-bottom: 1px solid var(--line);
          }

          .panel-title {
            font-size: 28px;
          }

          .panel-subtitle {
            font-size: 14px;
            margin-top: 6px;
          }

          .panel-section {
            padding: 0 28px 24px;
          }

          /* Más separación del score en desktop */
          .panel-section-score {
            padding-top: 24px;
          }

          /* Grid principal: 4 columnas en desktop */
          .stats-grid-main {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          /* Grid secundario: 2 columnas (Energía y Nutrición lado a lado) */
          .stats-grid-secondary {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          /* Grid heatmap + month summary: 2 columnas */
          .heatmap-summary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }

          .secondary-card {
            padding: 24px;
            border-radius: 18px;
            gap: 16px;
          }

          .secondary-label {
            font-size: 11px;
            letter-spacing: 0.12em;
          }

          .secondary-value {
            font-size: 32px;
          }

          .secondary-unit {
            font-size: 16px;
          }

          .secondary-sub {
            font-size: 13px;
          }

          .nutrition-add-btn {
            padding: 12px;
            font-size: 13px;
            border-radius: 12px;
          }
        }

        /* Large desktop */
        @media (min-width: 1200px) {
          .panel-header {
            padding: 48px 48px 24px;
          }

          .panel-section {
            padding: 0 48px 24px;
          }

          .panel-section-score {
            padding-top: 32px;
          }

          .stats-grid-main {
            gap: 24px;
          }

          .stats-grid-secondary {
            gap: 24px;
          }

          .secondary-card {
            padding: 28px;
          }

          .secondary-value {
            font-size: 36px;
          }
        }
      `}</style>
    </div>
  );
}
