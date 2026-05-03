"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, StateBlock } from "@/components/ui";
import { MetricsSkeleton } from "./metrics-skeleton";
import type { MetricEntry } from "./_types";

type Props = {
  metrics: MetricEntry[] | null;
  loadMetrics: () => void;
};

export function MetricsTab({ metrics, loadMetrics }: Props) {
  const { api } = useAuth();
  const toast = useToast();

  const [measuredAt, setMeasuredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [chestCm, setChestCm] = useState("");
  const [armCm, setArmCm] = useState("");
  const [thighCm, setThighCm] = useState("");
  const [metricNotes, setMetricNotes] = useState("");
  const [savingMetric, setSavingMetric] = useState(false);

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

  const inputStyle = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" } as const;
  const labelStyle = { fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase" as const, letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 };

  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Nueva medición</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>Fecha</div>
              <input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <div style={labelStyle}>Peso (kg)</div>
              <input type="number" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.currentTarget.value)} placeholder="0.0" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Cintura (cm)</div>
              <input type="number" inputMode="decimal" value={waistCm} onChange={(e) => setWaistCm(e.currentTarget.value)} placeholder="0.0" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Cadera (cm)</div>
              <input type="number" inputMode="decimal" value={hipsCm} onChange={(e) => setHipsCm(e.currentTarget.value)} placeholder="0.0" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Pecho (cm)</div>
              <input type="number" inputMode="decimal" value={chestCm} onChange={(e) => setChestCm(e.currentTarget.value)} placeholder="0.0" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Brazo (cm)</div>
              <input type="number" inputMode="decimal" value={armCm} onChange={(e) => setArmCm(e.currentTarget.value)} placeholder="0.0" style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Muslo (cm)</div>
              <input type="number" inputMode="decimal" value={thighCm} onChange={(e) => setThighCm(e.currentTarget.value)} placeholder="0.0" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={labelStyle}>Notas</div>
            <textarea value={metricNotes} onChange={(e) => setMetricNotes(e.currentTarget.value)} rows={3} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Button disabled={savingMetric || (!weightKg && !waistCm && !hipsCm && !chestCm && !armCm && !thighCm)} onClick={saveMetric}>
              {savingMetric ? "Guardando…" : "Registrar"}
            </Button>
          </div>
        </div>
      </div>

      {metrics === null ? (
        <MetricsSkeleton />
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
                    const px2 = ((i - 1) / (arr.length - 1)) * 300;
                    const py2 = 80 - (((arr[i - 1].weight - minW) / ((maxW - minW) || 1)) * 60 + 10);
                    return <line key={p.day} x1={px2} y1={py2} x2={x} y2={y} stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" />;
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
  );
}
