"use client";

import { useMemo } from "react";
import { StateBlock } from "@/components/ui";
import { ActivitySkeleton } from "./activity-skeleton";
import type { HealthEntry } from "./_types";

type Props = {
  health: HealthEntry[] | null;
  onSelectDay: (day: string) => void;
};

export function ActivityTab({ health, onSelectDay }: Props) {
  const steps7 = useMemo(() => {
    const list = (health ?? []).slice(0, 7).reverse();
    const maxSteps = Math.max(...list.map((e) => e.steps ?? 0), 1);
    return { list, maxSteps };
  }, [health]);

  if (health === null) {
    return <ActivitySkeleton />;
  }

  return (
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
                onClick={() => onSelectDay(e.day)}
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
  );
}
