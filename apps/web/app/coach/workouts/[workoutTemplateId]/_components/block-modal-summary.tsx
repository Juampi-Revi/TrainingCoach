"use client";

import type { BlockType, IntervalType } from "@regen/types";

function toPosInt(raw: string): number | null {
  const n = parseInt(raw);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function fmtSecs(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

export function BlockModalSummary({
  blockType,
  intervalType,
  work,
  rest,
  rounds,
  total,
  targetMinutes,
  restBetweenExercises,
  restAfterSeconds,
}: {
  blockType: BlockType;
  intervalType: IntervalType | null;
  work: string;
  rest: string;
  rounds: string;
  total: string;
  targetMinutes: string;
  restBetweenExercises: string;
  restAfterSeconds: string;
}) {
  const isInterval = blockType === "intervals" && !!intervalType;
  const isCardio = blockType === "cardio";
  const isEmom = intervalType === "emom";
  const isAmrap = intervalType === "amrap";
  const showWorkRest = isInterval && !isEmom && !isAmrap;

  const wSecs = toPosInt(work);
  const rSecs = toPosInt(rest);
  const roundsN = toPosInt(rounds);
  const restAfterSecs = toPosInt(restAfterSeconds);
  const restBetweenSecs = toPosInt(restBetweenExercises);

  const totalSecs = isInterval
    ? (isEmom ? (roundsN ? roundsN * 60 : null) : isAmrap ? toPosInt(total) : (showWorkRest && roundsN && wSecs && rSecs ? (wSecs + rSecs) * roundsN : null))
    : isCardio
      ? (toPosInt(targetMinutes) ? toPosInt(targetMinutes)! * 60 : null)
      : (toPosInt(targetMinutes) ? toPosInt(targetMinutes)! * 60 : null);

  const roundSecs = showWorkRest && wSecs && rSecs ? wSecs + rSecs : isEmom ? 60 : null;
  const workTotalSecs = showWorkRest && wSecs && roundsN ? wSecs * roundsN : null;
  const restTotalSecs = showWorkRest && rSecs && roundsN ? rSecs * roundsN : null;

  return (
    <div style={{ border: "1px solid var(--line-2)", borderRadius: 12, padding: 12, background: "var(--bg-2)" }}>
      <div className="ta-mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", color: "var(--text-mute)" }}>
        RESUMEN DEL BLOQUE
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ padding: "10px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)" }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: ".1em", fontWeight: 800 }}>
            DURACIÓN TOTAL
          </div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
            {fmtSecs(totalSecs)}
          </div>
          {restAfterSecs ? (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-dim)" }}>
              + descanso post {fmtSecs(restAfterSecs)} = {fmtSecs((totalSecs ?? 0) + restAfterSecs)}
            </div>
          ) : (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-dim)" }}>
              Preparación: —
            </div>
          )}
        </div>

        <div style={{ padding: "10px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)" }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: ".1em", fontWeight: 800 }}>
            SERIE / RONDA
          </div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
            {isEmom ? "60s (1 minuto)" : showWorkRest ? fmtSecs(roundSecs) : "—"}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-dim)" }}>
            {isEmom
              ? "Trabajo: reps o seg por ejercicio · Descanso: resto del minuto"
              : showWorkRest
                ? `Trabajo ${fmtSecs(wSecs)} · Descanso ${fmtSecs(rSecs)}`
                : "—"}
          </div>
        </div>
      </div>

      {(showWorkRest || isEmom || isAmrap) && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ padding: "10px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)" }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: ".1em", fontWeight: 800 }}>
              RONDAS / MIN
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
              {isEmom ? (roundsN ? `${roundsN} min` : "—") : roundsN ? String(roundsN) : "—"}
            </div>
          </div>
          <div style={{ padding: "10px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)" }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: ".1em", fontWeight: 800 }}>
              TRABAJO TOTAL
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
              {showWorkRest ? fmtSecs(workTotalSecs) : isEmom ? "según ejercicios" : "—"}
            </div>
          </div>
          <div style={{ padding: "10px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)" }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: ".1em", fontWeight: 800 }}>
              DESCANSO TOTAL
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
              {showWorkRest ? fmtSecs(restTotalSecs) : isEmom ? "auto" : "—"}
            </div>
          </div>
        </div>
      )}

      {(restBetweenSecs || restAfterSecs) && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-dim)", lineHeight: 1.35 }}>
          {restBetweenSecs ? `Descanso entre ejercicios: ${fmtSecs(restBetweenSecs)}.` : null}
          {restBetweenSecs && restAfterSecs ? " " : null}
          {restAfterSecs ? `Descanso después del bloque: ${fmtSecs(restAfterSecs)}.` : null}
        </div>
      )}
    </div>
  );
}

