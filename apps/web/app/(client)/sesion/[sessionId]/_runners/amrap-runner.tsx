"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@/components/ui";
import type { WorkoutBlockSummary, SessionExercise } from "@regen/types";
import { MUSCLE_LABEL } from "@/lib/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSecs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}:${String(sec).padStart(2, "0")}`;
  return String(Math.max(0, s));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AmrapRunnerProps {
  block: WorkoutBlockSummary;
  exercises: SessionExercise[];
  sessionId: string;
  api: { put: (url: string, body: Record<string, unknown>) => Promise<unknown> };
  onClose: () => void;
  onSaved: () => void;
  OverlayHeader: React.ComponentType<{
    block: WorkoutBlockSummary;
    round?: number;
    totalRounds?: number;
    onClose: () => void;
  }>;
  DoneScreen: React.ComponentType<{ onClose: () => void }>;
  primaryButtonStyle: (bg: string, color: string) => React.CSSProperties;
}

// ─── AMRAP Runner ─────────────────────────────────────────────────────────────

export function AmrapRunner({
  block,
  exercises,
  sessionId,
  api,
  onClose,
  onSaved,
  OverlayHeader,
  DoneScreen,
  primaryButtonStyle,
}: AmrapRunnerProps) {
  const totalSecs = block.totalDurationSeconds ?? 600;

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(totalSecs);
  const [round, setRound] = useState(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [completions, setCompletions] = useState<Record<string, number>>(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, 0]))
  );
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const savingRef = useRef(false);

  const finalize = useCallback(
    async (currentChecked: Set<string>, currentCompletions: Record<string, number>) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setDone(true);

      for (const ex of exercises) {
        const full = currentCompletions[ex.id] ?? 0;
        const partial = currentChecked.has(ex.id) ? 1 : 0;
        const totalReps = full + partial;
        const existingCount = ex.sets.length;
        if (totalReps === 0) continue;
        try {
          await api.put(
            `/client/sessions/${sessionId}/exercises/${ex.id}/sets/${existingCount + 1}`,
            { reps: totalReps }
          );
        } catch {
          // best-effort
        }
      }

      onSaved();
      setSaving(false);
      savingRef.current = false;
    },
    [exercises, api, sessionId, onSaved]
  );

  const finalizeRef = useRef(finalize);
  finalizeRef.current = finalize;
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const completionsRef = useRef(completions);
  completionsRef.current = completions;

  useEffect(() => {
    if (!started || paused || done) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setTimeout(() => finalizeRef.current(checkedRef.current, completionsRef.current), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, paused, done]);

  const toggleExercise = useCallback(
    (exId: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(exId)) {
          next.delete(exId);
          return next;
        }
        next.add(exId);
        if (next.size === exercises.length) {
          setCompletions((c) => {
            const updated = { ...c };
            for (const ex of exercises) {
              updated[ex.id] = (updated[ex.id] ?? 0) + 1;
            }
            return updated;
          });
          setRound((r) => r + 1);
          return new Set();
        }
        return next;
      });
    },
    [exercises]
  );

  if (done) return <DoneScreen onClose={onClose} />;

  const isUrgent = seconds <= 30;
  const totalFullRounds = Math.min(...exercises.map((ex) => completions[ex.id] ?? 0));

  return (
    <>
      <OverlayHeader block={block} onClose={onClose} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 20px 32px", position: "relative", overflow: "hidden" }}>

        {/* Gradient */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: isUrgent
            ? "radial-gradient(ellipse at 50% -10%, rgba(255,80,80,.08) 0%, transparent 50%)"
            : "radial-gradient(ellipse at 50% -10%, rgba(122,184,255,.06) 0%, transparent 50%)",
          transition: "background .5s",
        }} />

        {/* Global countdown */}
        <div style={{ textAlign: "center", paddingTop: 24, marginBottom: 24, position: "relative" }}>
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginBottom: 6, letterSpacing: ".1em" }}>
            TIEMPO RESTANTE
          </div>
          <div className="ta-mono" style={{
            fontSize: 72, fontWeight: 700, lineHeight: 1,
            color: isUrgent ? "var(--danger)" : "var(--text)",
            letterSpacing: "-.03em", transition: "color .5s",
          }}>
            {fmtSecs(seconds)}
          </div>
          <div className="ta-mono" style={{ fontSize: 12, color: "var(--lime)", fontWeight: 700, marginTop: 8 }}>
            Ronda {round}
            {totalFullRounds > 0 && (
              <span style={{ color: "var(--text-mute)", fontWeight: 400 }}>
                {" · "}{totalFullRounds} completa{totalFullRounds !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Exercise checklist */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", position: "relative" }}>
          {exercises.map((ex) => {
            const isChecked = checked.has(ex.id);
            const muscle = ex.exercise.primaryMuscle;
            const targetReps = ex.target?.reps;
            return (
              <button
                key={ex.id}
                onClick={() => started && toggleExercise(ex.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: isChecked ? "rgba(215,255,58,.08)" : "var(--bg-1)",
                  border: `1px solid ${isChecked ? "var(--lime)" : "var(--line)"}`,
                  borderRadius: 12, cursor: started ? "pointer" : "default",
                  textAlign: "left", transition: "background .2s, border-color .2s",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: `2px solid ${isChecked ? "var(--lime)" : "var(--line-2)"}`,
                  background: isChecked ? "var(--lime)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background .2s, border-color .2s",
                }}>
                  {isChecked && <Icon name="check" size={14} color="#000" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: isChecked ? "var(--text-mute)" : "var(--text)", textDecoration: isChecked ? "line-through" : "none" }}>
                    {ex.exercise.name}
                  </div>
                  {(muscle || targetReps) && (
                    <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
                      {[muscle ? (MUSCLE_LABEL[muscle] ?? muscle) : null, targetReps ? `${targetReps} reps` : null].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                {completions[ex.id] > 0 && (
                  <div className="ta-mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--lime)", flexShrink: 0 }}>
                    ×{completions[ex.id]}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
          {!started ? (
            <button onClick={() => setStarted(true)} style={primaryButtonStyle("#7AB8FF", "#000")}>
              <Icon name="play" size={18} color="#000" />
              <span>Iniciar</span>
            </button>
          ) : (
            <>
              <button onClick={() => finalize(checked, completions)} disabled={saving} style={primaryButtonStyle("var(--danger)", "#fff")}>
                <Icon name="check" size={18} color="#fff" />
                <span>Finalizar</span>
              </button>
              <button onClick={() => setPaused((p) => !p)} style={primaryButtonStyle("var(--bg-2)", "var(--text)")}>
                <Icon name={paused ? "play" : "pause"} size={18} />
                <span>{paused ? "Reanudar" : "Pausar"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
