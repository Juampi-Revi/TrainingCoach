"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@/components/ui";
import type { WorkoutBlockSummary, SessionExercise } from "@regen/types";
import { MUSCLE_LABEL } from "@/lib/constants";
import { CircleTimer } from "./circle-timer";
import { useSounds } from "../_hooks/use-sounds";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmomRunnerProps {
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

// ─── EMOM Runner ──────────────────────────────────────────────────────────────

export function EmomRunner({
  block,
  exercises,
  sessionId,
  api,
  onClose,
  onSaved,
  OverlayHeader,
  DoneScreen,
  primaryButtonStyle,
}: EmomRunnerProps) {
  const minuteSeconds =
    block.totalDurationSeconds && block.rounds
      ? Math.floor(block.totalDurationSeconds / block.rounds)
      : 60;

  const totalMinutes =
    block.rounds ??
    (block.totalDurationSeconds ? Math.floor(block.totalDurationSeconds / 60) : 1);

  const { playStart, playComplete, playBeep, playCountdown } = useSounds();

  const [setsCount, setSetsCount] = useState<Record<string, number>>(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, ex.sets.length]))
  );

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(minuteSeconds);
  const [minute, setMinute] = useState(1);
  const [repsInput, setRepsInput] = useState<string>("");
  const [done, setDone] = useState(false);

  const exIdx = (minute - 1) % exercises.length;
  const currentEx = exercises[exIdx];

  // Play sound when timer starts
  useEffect(() => {
    if (started && !paused) {
      playStart();
    }
  }, [started, paused, playStart]);

  // Play beep at the start of each minute
  useEffect(() => {
    if (started && !paused && seconds === minuteSeconds && minute > 1) {
      playBeep(2);
    }
  }, [minute, started, paused, seconds, minuteSeconds, playBeep]);

  // Play countdown beeps for last 3 seconds
  useEffect(() => {
    if (!started || paused || done) return;
    playCountdown(seconds);
  }, [seconds, started, paused, done, playCountdown]);

  // Play complete sound when done
  useEffect(() => {
    if (done) {
      playComplete();
    }
  }, [done, playComplete]);

  useEffect(() => {
    const target = currentEx.target?.reps ?? "";
    setRepsInput(target ?? "");
  }, [currentEx]);

  const saveCurrentSet = useCallback(
    async (reps: string) => {
      const ex = currentEx;
      const count = setsCount[ex.id] ?? ex.sets.length;
      const nextSetNum = count + 1;
      try {
        await api.put(
          `/client/sessions/${sessionId}/exercises/${ex.id}/sets/${nextSetNum}`,
          { reps: reps !== "" ? Number(reps) : null }
        );
        setSetsCount((prev) => ({ ...prev, [ex.id]: nextSetNum }));
        onSaved();
      } catch {
        // best-effort
      }
    },
    [currentEx, setsCount, api, sessionId, onSaved]
  );

  const advanceMinute = useCallback(
    async (reps: string) => {
      await saveCurrentSet(reps);
      if (minute >= totalMinutes) {
        setDone(true);
        return;
      }
      setMinute((m) => m + 1);
      setSeconds(minuteSeconds);
    },
    [saveCurrentSet, minute, totalMinutes, minuteSeconds]
  );

  const advanceMinuteRef = useRef(advanceMinute);
  advanceMinuteRef.current = advanceMinute;
  const repsInputRef = useRef(repsInput);
  repsInputRef.current = repsInput;

  useEffect(() => {
    if (!started || paused || done) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setTimeout(() => advanceMinuteRef.current(repsInputRef.current), 0);
          return minuteSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, paused, done, minuteSeconds]);

  if (done) return <DoneScreen onClose={onClose} />;

  const muscle = currentEx.exercise.primaryMuscle;
  const isUrgent = seconds <= 10;
  const timerColor = isUrgent ? "var(--danger)" : "var(--lime)";

  return (
    <>
      <OverlayHeader block={block} round={minute} totalRounds={totalMinutes} onClose={onClose} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Lime gradient */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% -10%, rgba(215,255,58,.06) 0%, transparent 55%)",
        }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 32px", position: "relative" }}>

          {/* Ring + exercise */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <CircleTimer seconds={seconds} total={minuteSeconds} color={timerColor} />

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{currentEx.exercise.name}</div>
              {muscle && (
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
                  {MUSCLE_LABEL[muscle] ?? muscle}
                </div>
              )}
            </div>

            {/* Reps input */}
            <div style={{ width: "100%", maxWidth: 280 }}>
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginBottom: 8, textAlign: "center" }}>
                REPS COMPLETADAS
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={repsInput}
                onChange={(e) => setRepsInput(e.target.value)}
                placeholder={currentEx.target?.reps ?? "0"}
                style={{
                  width: "100%",
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  outline: "none",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
            {Array.from({ length: totalMinutes }).map((_, i) => (
              <div key={i} style={{
                width: Math.min(8, Math.floor(280 / totalMinutes) - 2),
                height: 8,
                borderRadius: "50%",
                background: i < minute - 1 ? "var(--lime)" : i === minute - 1 ? "rgba(215,255,58,.5)" : "var(--bg-2)",
                transition: "background .3s",
              }} />
            ))}
          </div>

          {!started ? (
            <button onClick={() => setStarted(true)} style={primaryButtonStyle("var(--lime)", "#000")}>
              <Icon name="play" size={18} color="#000" />
              <span>Iniciar</span>
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => advanceMinute(repsInput)} style={primaryButtonStyle("var(--lime)", "#000")}>
                <Icon name="check" size={18} color="#000" />
                <span>Completé</span>
              </button>
              <button onClick={() => setPaused((p) => !p)} style={primaryButtonStyle("var(--bg-2)", "var(--text)")}>
                <Icon name={paused ? "play" : "pause"} size={18} />
                <span>{paused ? "Reanudar" : "Pausar"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
