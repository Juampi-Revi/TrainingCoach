"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ConfirmModal } from "@/components/ui";
import type { SessionExercise } from "@regen/types";
import { PhaseLabel, phaseColor } from "./phase-label";

export function RestTimerOverlay({
  seconds,
  total,
  nextEx,
  suggestion,
  onSkip,
  onAdjust,
}: {
  seconds: number;
  total: number;
  nextEx: SessionExercise | null;
  suggestion?: string | null;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;
  const circumference = 2 * Math.PI * 92;
  const progress = total > 0 ? Math.max(0, seconds / total) : 0;
  const dashoffset = circumference * (1 - progress);
  const ready = seconds <= 5;
  const ringColor = ready ? phaseColor("work") : phaseColor("rest");
  const lastHaptic = useRef<number | null>(null);
  const [confirmEarly, setConfirmEarly] = useState(false);

  useEffect(() => {
    if (seconds > 0 && seconds <= 3 && lastHaptic.current !== seconds) {
      lastHaptic.current = seconds;
      try {
        navigator.vibrate?.(seconds === 1 ? [80, 40, 120] : 60);
      } catch {
        /* ignore */
      }
    }
    if (seconds === 0) lastHaptic.current = null;
  }, [seconds]);

  function requestEarly() {
    if (seconds > 8) {
      setConfirmEarly(true);
      return;
    }
    onSkip();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${ringColor} 12%, transparent), transparent 60%), var(--bg)`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 60 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
        <PhaseLabel phase={ready ? "work" : "rest"} hint={ready ? "¡Listo!" : "Respira…"} large />

        <button
          type="button"
          onClick={requestEarly}
          aria-label="Terminar descanso"
          style={{
            position: "relative",
            width: 200,
            height: 200,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg width="200" height="200" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--bg-2)" strokeWidth="6" />
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <div
              className="ta-mono"
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: ready ? "var(--lime)" : "var(--text)",
                letterSpacing: "-.02em",
                lineHeight: 1,
              }}
            >
              {display}
            </div>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".1em" }}>
              DE {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
            </div>
          </div>
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <Button size="md" variant="secondary" onClick={() => onAdjust(-15)}>−15s</Button>
          <Button size="md" variant="secondary" onClick={requestEarly}>
            {ready ? "Empezar" : "Empezar ahora"}
          </Button>
          <Button size="md" variant="secondary" onClick={() => onAdjust(15)}>+15s</Button>
        </div>

        {suggestion && (
          <div
            style={{
              maxWidth: 320,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              fontSize: 12,
              color: "var(--text-mute)",
              textAlign: "center",
              lineHeight: 1.45,
            }}
          >
            {suggestion}
          </div>
        )}

        {nextEx && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              textAlign: "center",
              maxWidth: 260,
            }}
          >
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>
              SIGUIENTE{nextEx.supersetGroup ? ` · ${nextEx.supersetGroup}` : ""}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{nextEx.exercise.name}</div>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
              {[
                nextEx.target?.sets && nextEx.target?.reps ? `${nextEx.target.sets} × ${nextEx.target.reps}` : null,
                nextEx.target?.intensityType && nextEx.target?.intensityTarget
                  ? `${nextEx.target.intensityType.toUpperCase()} ${nextEx.target.intensityTarget}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        )}
      </div>

      {confirmEarly && (
        <ConfirmModal
          message="¿Empezar la siguiente serie ahora?"
          confirmLabel="Empezar ahora"
          cancelLabel="Seguir descansando"
          onCancel={() => setConfirmEarly(false)}
          onConfirm={() => {
            setConfirmEarly(false);
            onSkip();
          }}
        />
      )}
    </div>
  );
}
