"use client";

import type { BlockType, IntervalType } from "@regen/types";

function toPosInt(raw: string): number | null {
  const n = parseInt(raw);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function fmtSecs(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

function fmtMin(raw: string): string {
  const n = toPosInt(raw);
  if (!n) return "0min";
  return `${n}min`;
}

interface BlockModalSummaryProps {
  blockType: BlockType;
  intervalType: IntervalType | null;
  prepare: string;
  work: string;
  rest: string;
  rounds: string;
  setCount: string;
  setRest: string;
  total: string;
  targetMinutes: string;
  restBetweenExercises: string;
  restAfterSeconds: string;
}

export function BlockModalSummary({
  blockType,
  intervalType,
  prepare,
  work,
  rest,
  rounds,
  setCount,
  setRest,
  total,
  targetMinutes,
  restBetweenExercises,
  restAfterSeconds,
}: BlockModalSummaryProps) {
  const isInterval = blockType === "intervals" && !!intervalType;
  const isEmom = intervalType === "emom";
  const isAmrap = intervalType === "amrap";
  const showWorkRest = isInterval && !isEmom && !isAmrap;

  const prepareSecs = toPosInt(prepare);
  const wSecs = toPosInt(work);
  const rSecs = toPosInt(rest);
  const roundsN = toPosInt(rounds);
  const setsN = toPosInt(setCount) ?? 1;
  const setRestSecs = toPosInt(setRest);
  const restAfterSecs = toPosInt(restAfterSeconds);
  const restBetweenSecs = toPosInt(restBetweenExercises);

  const totalSecs = isInterval
    ? (isEmom
      ? (roundsN ? (prepareSecs ?? 0) + roundsN * 60 : null)
      : isAmrap
        ? (toPosInt(total) ? (prepareSecs ?? 0) + toPosInt(total)! : null)
        : (showWorkRest && roundsN && wSecs && rSecs
          ? (prepareSecs ?? 0) + ((wSecs + rSecs) * roundsN * setsN) + ((setRestSecs ?? 0) * Math.max(0, setsN - 1))
          : null))
    : (toPosInt(targetMinutes) ? toPosInt(targetMinutes)! * 60 : null);

  const parts: string[] = [];

  if (totalSecs && totalSecs > 0) {
    parts.push(fmtSecs(totalSecs));
  }

  if (isEmom && roundsN) {
    parts.push(`${roundsN} minutos`);
  } else if (showWorkRest && roundsN && wSecs && rSecs) {
    parts.push(`${roundsN} rondas`);
    if (setsN > 1) parts.push(`${setsN} series`);
    parts.push(`${fmtSecs(wSecs)} trabajo / ${fmtSecs(rSecs)} descanso`);
  } else if (isAmrap && toPosInt(total)) {
    parts.push(fmtMin(total));
  } else if (toPosInt(targetMinutes)) {
    parts.push(fmtMin(targetMinutes));
  }

  if (restAfterSecs && restAfterSecs > 0) {
    parts.push(`+ ${fmtSecs(restAfterSecs)} de descanso antes del siguiente bloque`);
  }

  if (restBetweenSecs && restBetweenSecs > 0) {
    parts.push(`${fmtSecs(restBetweenSecs)} entre ejercicios`);
  }

  const summary = parts.join(" · ");

  if (!summary) return null;

  return (
    <div style={{ border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 14px", background: "var(--bg-2)" }}>
      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700, color: "var(--lime)" }}>Resumen: </span>
        {summary}
      </div>
    </div>
  );
}