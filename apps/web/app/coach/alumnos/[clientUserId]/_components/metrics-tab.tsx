"use client";

import { StateBlock } from "@/components/ui";
import type { HealthData } from "./_types";

interface MetricsTabProps {
  health: HealthData | null;
  healthLoading: boolean;
}

export function MetricsTab({ health, healthLoading }: MetricsTabProps) {
  return (
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
  );
}
