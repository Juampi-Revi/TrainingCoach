"use client";

import { Button } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import { fmtDuration } from "@/lib/constants";

export function WarmupOverlay({
  elapsedMs, targetMs, notes, exercises, running, onToggle, onReset, onDone,
}: {
  elapsedMs: number;
  targetMs: number | null;
  notes?: string | null;
  exercises: SessionExercise[];
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const display = fmtDuration(elapsedMs);
  const circumference = 2 * Math.PI * 92;
  const progress = targetMs && targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : 0;
  const dashoffset = circumference * (1 - progress);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 950,
      background: "radial-gradient(circle at 50% 40%, rgba(215,255,58,.08), transparent 60%), var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ height: 60 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", letterSpacing: ".15em", fontWeight: 700 }}>CALENTAMIENTO</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", textAlign: "center", maxWidth: 320, lineHeight: 1.5 }}>
          Opcional · no cuenta para el entreno · no hace falta registrar series
        </div>

        <div style={{ position: "relative", width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--bg-2)" strokeWidth="6" />
            {targetMs && targetMs > 0 && (
              <circle
                cx="100" cy="100" r="92" fill="none"
                stroke="var(--lime)"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            )}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div className="ta-mono" style={{ fontSize: 52, fontWeight: 700, color: "var(--text)", letterSpacing: "-.02em", lineHeight: 1 }}>
              {display}
            </div>
            {targetMs && targetMs > 0 && (
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".1em" }}>
                OBJ {fmtDuration(targetMs)}
              </div>
            )}
          </div>
        </div>

        {notes && (
          <div style={{ padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, maxWidth: 340, width: "100%" }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>INDICACIONES</div>
            <div style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap" }}>{notes}</div>
          </div>
        )}

        {exercises.length > 0 && (
          <div style={{ width: "100%", maxWidth: 340 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>EJERCICIOS</div>
            {exercises.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{e.exercise.name}</div>
                  {(e.target?.sets || e.target?.reps) && (
                    <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 1 }}>
                      {[e.target?.sets ? `${e.target.sets} series` : null, e.target?.reps ? e.target.reps : null].filter(Boolean).join(" × ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Button size="md" variant="secondary" icon={running ? "pause" : "play"} onClick={onToggle}>
            {running ? "Pausa" : "Play"}
          </Button>
          <Button size="md" variant="secondary" onClick={onReset}>Reiniciar</Button>
        </div>

        <div style={{ width: "100%", maxWidth: 340 }}>
          <Button size="xl" icon="check" onClick={onDone} style={{ width: "100%" }}>
            Terminé el calentamiento
          </Button>
        </div>
      </div>
    </div>
  );
}
