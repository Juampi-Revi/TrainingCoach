"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { ClientDashboard } from "@regen/types";
import { QuickFoodLogger } from "./_components/quick-food-logger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSleepH(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

function weekLabel(weekStart: string): string {
  const s = new Date(weekStart);
  const e = new Date(s.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return `${fmt(s)} – ${fmt(e)}`;
}

// ─── SVG Ring ─────────────────────────────────────────────────────────────────

function Ring({ value, color, size = 52, stroke = 5 }: {
  value: number; // 0-1
  color: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke * 2) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)));
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
    </svg>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 90;
  const stroke = 7;
  const r = (size - stroke * 2) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = score / 100;
  const offset = circumference * (1 - Math.min(1, fraction));
  const color = score >= 80 ? "var(--lime)" : score >= 50 ? "#FF8E72" : "var(--danger)";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease, stroke .3s" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="ta-mono" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color }}>{score}</div>
        <div style={{ fontSize: 9, color: "var(--text-mute)", marginTop: 2 }}>/100</div>
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent, ring }: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  ring?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--bg-1)",
      border: "1px solid var(--line)",
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: "-.02em" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>{sub}</div>}
        </div>
        {ring && <div style={{ flexShrink: 0 }}>{ring}</div>}
      </div>
    </div>
  );
}

// ─── Nutrition Bar ────────────────────────────────────────────────────────────

function NutritionBar({ good, regular, poor }: { good: number; regular: number; poor: number }) {
  const total = good + regular + poor;
  if (total === 0) return <div style={{ fontSize: 12, color: "var(--text-mute)" }}>Sin registros esta semana</div>;
  const score = total > 0 ? Math.round(((good * 10 + regular * 5) / (total * 10)) * 10) : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--lime)", letterSpacing: "-.02em" }}>{score}/10</div>
        <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{total} comidas</div>
      </div>
      <div style={{ display: "flex", gap: 2, borderRadius: 4, overflow: "hidden", height: 8 }}>
        {good > 0 && <div style={{ flex: good, background: "var(--lime)", transition: "flex .4s" }} />}
        {regular > 0 && <div style={{ flex: regular, background: "#FF8E72", transition: "flex .4s" }} />}
        {poor > 0 && <div style={{ flex: poor, background: "var(--danger)", transition: "flex .4s" }} />}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--lime)" }} />
          <span style={{ fontSize: 10, color: "var(--text-mute)" }}>{good} buenas</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "#FF8E72" }} />
          <span style={{ fontSize: 10, color: "var(--text-mute)" }}>{regular} ok</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--danger)" }} />
          <span style={{ fontSize: 10, color: "var(--text-mute)" }}>{poor} pobres</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PanelPage() {
  const { api } = useAuth();
  const [data, setData] = useState<ClientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [foodLoggerOpen, setFoodLoggerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ClientDashboard>("/client/dashboard");
      setData(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: "var(--text-mute)", fontSize: 13 }}>Cargando panel…</div>
      </div>
    );
  }

  const d = data;
  const workoutFraction = d && d.workoutsTarget ? d.workoutsCompleted / d.workoutsTarget : d ? Math.min(1, d.workoutsCompleted / 5) : 0;
  const energyFraction = d?.energyAvg ? d.energyAvg / 5 : 0;
  const stepsK = d?.stepsAvg ? Math.round(d.stepsAvg / 100) / 10 : null;

  return (
    <div style={{ padding: "20px 16px calc(100px + env(safe-area-inset-bottom))", maxWidth: 520, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".1em", marginBottom: 4 }}>
          MI PANEL
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Esta semana</div>
        {d && (
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
            {weekLabel(d.weekStart)}
          </div>
        )}
      </div>

      {/* Score + rings row */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
        <ScoreRing score={d?.weekScore ?? 0} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Score semanal</div>
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 3 }}>
            {d?.workoutsCompleted ?? 0} entreno{(d?.workoutsCompleted ?? 0) !== 1 ? "s" : ""}
            {d?.workoutsTarget ? ` / ${d.workoutsTarget}` : ""} completado{(d?.workoutsCompleted ?? 0) !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Ring value={workoutFraction} color="var(--lime)" size={36} stroke={4} />
              <span style={{ fontSize: 9, color: "var(--text-mute)" }}>Entrenos</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Ring value={energyFraction} color="#7AB8FF" size={36} stroke={4} />
              <span style={{ fontSize: 9, color: "var(--text-mute)" }}>Energía</span>
            </div>
            {stepsK !== null && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Ring value={Math.min(1, stepsK / 10)} color="#FF8E72" size={36} stroke={4} />
                <span style={{ fontSize: 9, color: "var(--text-mute)" }}>Pasos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick log strip */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setFoodLoggerOpen(true)}
          style={{
            flex: 1, padding: "12px 8px", background: "var(--bg-1)", border: "1px solid var(--line)",
            borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}
        >
          <div style={{ fontSize: 20 }}>🍽️</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Comida</div>
          {d && (d.foodGood + d.foodRegular + d.foodPoor) > 0 && (
            <div style={{ fontSize: 10, color: "var(--lime)", fontWeight: 700 }}>
              {d.foodGood + d.foodRegular + d.foodPoor}
            </div>
          )}
        </button>
        <div style={{
          flex: 1, padding: "12px 8px", background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          opacity: 0.4,
        }}>
          <div style={{ fontSize: 20 }}>💊</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Suplementos</div>
          <div style={{ fontSize: 10, color: "var(--text-mute)" }}>Pronto</div>
        </div>
        <div style={{
          flex: 1, padding: "12px 8px", background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          opacity: 0.4,
        }}>
          <div style={{ fontSize: 20 }}>😴</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Sueño</div>
          <div style={{ fontSize: 10, color: "var(--text-mute)" }}>Pronto</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <MetricCard
          label="ENTRENAMIENTOS"
          value={String(d?.workoutsCompleted ?? 0)}
          sub={d?.workoutsTarget ? `/ ${d.workoutsTarget} esta semana` : "esta semana"}
          accent="var(--lime)"
          ring={<Ring value={workoutFraction} color="var(--lime)" size={44} stroke={5} />}
        />
        <MetricCard
          label="ENERGÍA · 7D"
          value={d?.energyAvg ? d.energyAvg.toFixed(1) : "—"}
          sub={d?.energyAvg ? "promedio /5" : "sin datos"}
          accent="#7AB8FF"
          ring={<Ring value={energyFraction} color="#7AB8FF" size={44} stroke={5} />}
        />
        <MetricCard
          label="PASOS · 7D"
          value={stepsK !== null ? `${stepsK}k` : "—"}
          sub={stepsK !== null ? "promedio diario" : "no registrado"}
          accent="#FF8E72"
          ring={stepsK !== null ? <Ring value={Math.min(1, stepsK / 10)} color="#FF8E72" size={44} stroke={5} /> : undefined}
        />
        <MetricCard
          label="SUEÑO · 7D"
          value={fmtSleepH(d?.sleepMinutesAvg ?? null)}
          sub={d?.sleepMinutesAvg ? "promedio" : "no registrado"}
          accent="var(--text-dim)"
        />
      </div>

      {/* Nutrition card */}
      <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px" }}>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 12 }}>
          NUTRICIÓN · 7D
        </div>
        <NutritionBar
          good={d?.foodGood ?? 0}
          regular={d?.foodRegular ?? 0}
          poor={d?.foodPoor ?? 0}
        />
        <button
          onClick={() => setFoodLoggerOpen(true)}
          style={{
            marginTop: 12, width: "100%", padding: "10px", background: "transparent",
            border: "1px dashed var(--line-2)", borderRadius: 10, cursor: "pointer",
            fontSize: 12, color: "var(--text-mute)", fontWeight: 600,
          }}
        >
          + Registrar comida
        </button>
      </div>

      {/* Food Logger modal */}
      {foodLoggerOpen && (
        <QuickFoodLogger
          onClose={() => setFoodLoggerOpen(false)}
          onSaved={() => { load(); }}
        />
      )}
    </div>
  );
}
