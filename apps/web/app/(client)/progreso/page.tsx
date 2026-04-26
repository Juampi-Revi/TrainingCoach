"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Button, KPI, StateBlock } from "@/components/ui";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

interface Metric {
  id: string;
  recordedAt: string;
  weight: number | null;
  bodyFat: number | null;
  notes: string | null;
}

export default function ProgresoPage() {
  const { api } = useAuth();
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .get<Metric[]>("/client/metrics")
      .then(setMetrics)
      .catch(console.error)
      .finally(() => {});
  }, [api]);

  useEffect(() => { load(); }, [load]);

  async function logWeight() {
    if (!weight) return;
    setSaving(true);
    try {
      await api.post("/client/metrics", { weight: Number(weight) });
      setWeight("");
      setMetrics(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const latest = metrics?.[0];
  const prev = metrics?.[1];
  const diff =
    latest?.weight && prev?.weight ? (latest.weight - prev.weight).toFixed(1) : null;

  const list = metrics ?? [];
  const maxWeight = Math.max(...list.map((m) => m.weight ?? 0), 1);
  const minWeight = Math.min(...list.filter((m) => m.weight).map((m) => m.weight as number), maxWeight);
  const range = maxWeight - minWeight || 1;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Progreso</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          Últimos 90 registros
        </div>
      </div>

      {/* Log new weight */}
      <div style={{ padding: "0 20px 20px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: 14,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Peso de hoy
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                style={{
                  width: 80,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text)",
                  outline: "none",
                  textAlign: "center",
                }}
              />
              <span style={{ fontSize: 13, color: "var(--text-mute)" }}>kg</span>
            </div>
          </div>
          <Button size="md" disabled={!weight || saving} onClick={logWeight}>
            {saving ? "…" : "Registrar"}
          </Button>
        </div>
      </div>

      {metrics === null ? (
        <StateBlock kind="loading" title="Cargando…" />
      ) : (
        <>
          {/* KPIs */}
          {latest && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 20px 20px" }}>
              <KPI
                label="Peso actual"
                value={latest.weight ? String(latest.weight) : "—"}
                unit="kg"
                trend={diff ? `${Number(diff) > 0 ? "+" : ""}${diff}kg` : undefined}
                hint={latest.recordedAt ? new Date(latest.recordedAt).toLocaleDateString("es") : ""}
              />
              <KPI
                label="Registros"
                value={String(list.length)}
                hint="total histórico"
              />
            </div>
          )}

          {/* Weight chart */}
          {list.length > 1 && (
            <div style={{ padding: "0 20px 20px" }}>
              <div
                style={{
                  padding: 16,
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Peso corporal</span>
                  <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                    últimas {Math.min(20, list.length)} entradas
                  </span>
                </div>
                <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                  {list
                    .filter((m) => m.weight)
                    .slice(0, 20)
                    .reverse()
                    .map((m, i, arr) => {
                      const x = (i / (arr.length - 1)) * 300;
                      const y = 80 - ((((m.weight as number) - minWeight) / range) * 60 + 10);
                      return i === 0 ? null : (
                        <line
                          key={i}
                          x1={(((i - 1) / (arr.length - 1)) * 300)}
                          y1={80 - ((((arr[i - 1].weight as number) - minWeight) / range) * 60 + 10)}
                          x2={x}
                          y2={y}
                          stroke="var(--lime)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  {list
                    .filter((m) => m.weight)
                    .slice(0, 20)
                    .reverse()
                    .map((m, i, arr) => {
                      const x = (i / (arr.length - 1)) * 300;
                      const y = 80 - ((((m.weight as number) - minWeight) / range) * 60 + 10);
                      return (
                        <circle key={i} cx={x} cy={y} r={i === arr.length - 1 ? 4 : 2} fill="var(--lime)" />
                      );
                    })}
                </svg>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--text-mute)",
                    fontFamily: "var(--font-mono)",
                    marginTop: 4,
                  }}
                >
                  <span>{minWeight}kg</span>
                  <span>{maxWeight}kg</span>
                </div>
              </div>
            </div>
          )}

          {/* List */}
          <div style={{ padding: "0 20px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Registros
            </div>
            {list.length === 0 ? (
              <StateBlock
                kind="empty"
                title="Sin registros"
                body="Registrá tu primer peso para empezar a ver tu progreso."
              />
            ) : (
              list.slice(0, 30).map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: i < 29 ? "1px solid var(--line)" : "none",
                    alignItems: "center",
                  }}
                >
                  <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                    {new Date(m.recordedAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {m.weight && (
                    <div className="ta-mono" style={{ fontSize: 16, fontWeight: 600 }}>
                      {m.weight} <span style={{ fontSize: 11, color: "var(--text-mute)" }}>kg</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <MobileTabBar active="chart" />
    </div>
  );
}
