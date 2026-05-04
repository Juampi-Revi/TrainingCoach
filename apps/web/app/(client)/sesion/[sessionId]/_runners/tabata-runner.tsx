"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@/components/ui";
import type { WorkoutBlockSummary, SessionExercise } from "@regen/types";
import { MUSCLE_LABEL } from "@/lib/constants";
import { CircleTimer } from "./circle-timer";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabataPhase = "work" | "rest" | "done";

interface TabataRunnerProps {
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

// ─── Tabata / HIIT Runner ─────────────────────────────────────────────────────

export function TabataRunner({
  block,
  exercises,
  sessionId,
  api,
  onClose,
  onSaved,
  OverlayHeader,
  DoneScreen,
  primaryButtonStyle,
}: TabataRunnerProps) {
  const totalRounds = block.rounds ?? 8;
  const workSecs = block.workSeconds ?? 20;
  const restSecs = block.restSeconds ?? 10;

  const [setsCount, setSetsCount] = useState<Record<string, number>>(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, ex.sets.length]))
  );

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<TabataPhase>("work");
  const [seconds, setSeconds] = useState(workSecs);
  const [round, setRound] = useState(1);
  const [exIdx, setExIdx] = useState(0);
  const [done, setDone] = useState(false);

  const savingRef = useRef(false);

  const currentEx = exercises[exIdx];

  const nextPhaseHint = useCallback((): string => {
    if (phase === "work") {
      return `Descanso ${restSecs}s`;
    }
    const nextExIdx = (exIdx + 1) % exercises.length;
    const nextRound = nextExIdx === 0 ? round + 1 : round;
    if (nextRound > totalRounds) return "Fin del bloque";
    return exercises[nextExIdx].exercise.name;
  }, [phase, exIdx, exercises, restSecs, round, totalRounds]);

  const saveSet = useCallback(
    async (ex: SessionExercise, count: number) => {
      if (savingRef.current) return;
      savingRef.current = true;
      const nextSetNum = count + 1;
      try {
        await api.put(
          `/client/sessions/${sessionId}/exercises/${ex.id}/sets/${nextSetNum}`,
          { durationSeconds: workSecs }
        );
        setSetsCount((prev) => ({ ...prev, [ex.id]: nextSetNum }));
        onSaved();
      } catch {
        // best-effort
      } finally {
        savingRef.current = false;
      }
    },
    [api, sessionId, workSecs, onSaved]
  );

  const stateRef = useRef({ phase, exIdx, round, setsCount, exercises, saveSet });
  stateRef.current = { phase, exIdx, round, setsCount, exercises, saveSet };

  useEffect(() => {
    if (!started || paused || done) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          const { phase: p, exIdx: ei, round: r, setsCount: sc, exercises: exs, saveSet: ss } =
            stateRef.current;
          if (p === "work") {
            const ex = exs[ei];
            const count = sc[ex.id] ?? ex.sets.length;
            setTimeout(() => ss(ex, count), 0);
            setPhase("rest");
            return restSecs;
          } else {
            const nextExIdx = (ei + 1) % exs.length;
            const nextRound = nextExIdx === 0 ? r + 1 : r;
            if (nextRound > totalRounds) {
              setDone(true);
              return 0;
            }
            setExIdx(nextExIdx);
            setRound(nextRound);
            setPhase("work");
            return workSecs;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, paused, done, restSecs, workSecs, totalRounds]);

  if (done) return <DoneScreen onClose={onClose} />;

  const isWork = phase === "work";
  const phaseColor = isWork ? "#FF8E72" : "#7AB8FF";
  const muscle = currentEx.exercise.primaryMuscle;

  return (
    <>
      <OverlayHeader block={block} round={round} totalRounds={totalRounds} onClose={onClose} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Phase gradient */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", transition: "background .6s",
          background: isWork
            ? "radial-gradient(ellipse at 50% -10%, rgba(255,142,114,.12) 0%, transparent 55%)"
            : "radial-gradient(ellipse at 50% -10%, rgba(122,184,255,.08) 0%, transparent 55%)",
        }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 24px", position: "relative" }}>

          {/* Phase badge */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
              borderRadius: 20, transition: "all .3s",
              background: isWork ? "rgba(255,142,114,.15)" : "rgba(122,184,255,.12)",
              border: `1px solid ${phaseColor}`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: phaseColor, transition: "background .3s" }} />
              <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", color: phaseColor, transition: "color .3s" }}>
                {isWork ? "WORK" : "REST"}
              </span>
            </div>
          </div>

          {/* SVG ring + exercise name */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <CircleTimer seconds={seconds} total={isWork ? workSecs : restSecs} color={phaseColor} />
            <div style={{ textAlign: "center" }}>
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".1em", marginBottom: 6 }}>
                {isWork ? `EJERCICIO ${exIdx + 1} / ${exercises.length}` : "DESCANSA"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>
                {isWork ? currentEx.exercise.name : "Recuperate"}
              </div>
              {isWork && muscle && (
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
                  {MUSCLE_LABEL[muscle] ?? muscle}
                </div>
              )}
              <div className="ta-mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--lime)", marginTop: 8 }}>
                RONDA {round} / {totalRounds}
              </div>
            </div>
          </div>

          {/* Round progress dots */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
              {Array.from({ length: totalRounds }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", transition: "background .3s",
                  background: i < round - 1 ? phaseColor
                    : i === round - 1 ? phaseColor + "80"
                    : "var(--bg-2)",
                }} />
              ))}
            </div>
          </div>

          {/* Next card */}
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 3 }}>
                SIGUIENTE
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nextPhaseHint()}
              </div>
            </div>
            <span style={{ fontSize: 18, color: "var(--text-dim)", flexShrink: 0 }}>›</span>
          </div>

          {/* Action button */}
          {!started ? (
            <button onClick={() => setStarted(true)} style={primaryButtonStyle(phaseColor, "#000")}>
              <Icon name="play" size={18} color="#000" />
              <span>Iniciar</span>
            </button>
          ) : (
            <button onClick={() => setPaused((p) => !p)} style={primaryButtonStyle("var(--bg-2)", "var(--text)")}>
              <Icon name={paused ? "play" : "pause"} size={18} />
              <span>{paused ? "Reanudar" : "Pausar"}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
