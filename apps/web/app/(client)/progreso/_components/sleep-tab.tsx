"use client";

import { useMemo } from "react";
import { StateBlock } from "@/components/ui";
import { SleepSkeleton } from "./sleep-skeleton";
import { fmtSleep } from "./_types";
import type { HealthEntry } from "./_types";

type Props = {
  health: HealthEntry[] | null;
  onSelectDay: (day: string) => void;
};

export function SleepTab({ health, onSelectDay }: Props) {
  const sleep7 = useMemo(() => {
    const list = (health ?? []).slice(0, 7).reverse();
    const maxMin = Math.max(...list.map((e) => e.sleepMinutes ?? 0), 1);
    return { list, maxMin };
  }, [health]);

  if (health === null) {
    return <SleepSkeleton />;
  }

  return (
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
                onClick={() => onSelectDay(e.day)}
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
  );
}
