"use client";

import { StateBlock } from "@/components/ui";
import type { HealthData } from "./_types";
import { fmtSleep } from "./_utils";

interface HealthTabProps {
  health: HealthData | null;
  healthLoading: boolean;
  onSelectDay: (day: string) => void;
}

export function HealthTab({ health, healthLoading, onSelectDay }: HealthTabProps) {
  return (
    <div>
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
              onClick={() => onSelectDay(e.day)}
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
    </div>
  );
}
