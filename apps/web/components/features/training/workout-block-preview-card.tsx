"use client";

import type { WorkoutBlockSummary, WorkoutTemplateDetail } from "@regen/types";
import { blockTypeLabel } from "@/lib/constants";
import {
  blockCoachSummary,
  blockPatternLabel,
  estimateBlockDurationSeconds,
  formatBlockDurationShort,
  getBlockExecutionPattern,
} from "@/lib/training-blocks";

type TemplateExercise = WorkoutTemplateDetail["exercises"][number];

function formatExerciseTarget(exercise: TemplateExercise) {
  const parts: string[] = [];
  if (exercise.targetSets && exercise.targetReps) parts.push(`${exercise.targetSets}x${exercise.targetReps}`);
  else if (exercise.durationSeconds) parts.push(`${exercise.durationSeconds}s`);
  if (exercise.intensityType && exercise.intensityTarget) {
    parts.push(`${exercise.intensityType.toUpperCase()} ${exercise.intensityTarget}`);
  }
  if (exercise.restSeconds) parts.push(`${exercise.restSeconds}s desc`);
  return parts.join(" · ") || "Libre";
}

function formatSecondsExact(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
}

function buildStudentRecipe(block: WorkoutBlockSummary) {
  const pattern = getBlockExecutionPattern(block);
  if (pattern === "guided_intervals") {
    const parts = [];
    if (block.prepareSeconds) parts.push(`${block.prepareSeconds}s prep`);
    if (block.rounds && block.workSeconds && block.restSeconds) {
      parts.push(`${block.rounds} rondas de ${block.workSeconds}s / ${block.restSeconds}s`);
    }
    if (block.setCount && block.setCount > 1) {
      parts.push(`${block.setCount} series`);
    }
    if (block.restBetweenSetsSeconds) {
      parts.push(`${block.restBetweenSetsSeconds}s entre series`);
    }
    return parts.join(" · ");
  }
  if (pattern === "emom") {
    return `${block.rounds ?? 0} min · cada minuto vuelve a empezar`;
  }
  if (pattern === "amrap") {
    return `${formatBlockDurationShort(estimateBlockDurationSeconds(block))} · repetí la ronda sin parar`;
  }
  if (pattern === "steady_state") {
    return `${block.targetMinutes ?? 0} min${block.targetZone ? ` · ${block.targetZone}` : ""}`;
  }
  if (pattern === "endurance_steps") {
    return `${block.steps.length} paso${block.steps.length === 1 ? "" : "s"} · seguí las consignas de cada pasada`;
  }
  if (pattern === "recovery") {
    return `${block.targetMinutes ? `${block.targetMinutes} min` : "bloque libre"} · soltura y recuperación`;
  }
  return blockCoachSummary(block);
}

export function WorkoutBlockPreviewCard({
  block,
  exercises,
}: {
  block: WorkoutBlockSummary;
  exercises: TemplateExercise[];
}) {
  const pattern = getBlockExecutionPattern(block);
  const estimated = formatBlockDurationShort(estimateBlockDurationSeconds(block));

  return (
    <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--accent-text)", letterSpacing: ".1em", fontWeight: 700 }}>
              {blockPatternLabel(block).toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
              {block.label ? `${blockTypeLabel(block.type, block.intervalType)} · ${block.label}` : blockTypeLabel(block.type, block.intervalType)}
            </div>
          </div>
          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 700 }}>
            {estimated}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 6, lineHeight: 1.45 }}>
          {buildStudentRecipe(block)}
        </div>
        {block.description && (
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6, lineHeight: 1.45 }}>
            {block.description}
          </div>
        )}
      </div>

      {pattern === "endurance_steps" && (
        <div style={{ display: "grid" }}>
          {block.steps.map((step, index) => (
            <div
              key={step.id}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 10,
                padding: "10px 14px",
                borderTop: index === 0 ? "none" : "1px solid var(--line)",
              }}
            >
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700 }}>
                {step.kind.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{step.label ?? `Paso ${index + 1}`}</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
                  {step.distanceMeters ? `${step.distanceMeters}m` : null}
                  {step.distanceMeters && step.durationSeconds ? " · " : null}
                  {step.durationSeconds ? formatSecondsExact(step.durationSeconds) : null}
                </div>
                {step.instruction && (
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.45 }}>
                    {step.instruction}
                  </div>
                )}
              </div>
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--accent-text)", fontWeight: 700, textAlign: "right" }}>
                {step.targetLabel ?? "Libre"}
              </div>
            </div>
          ))}
        </div>
      )}

      {pattern !== "endurance_steps" && exercises.length > 0 && (
        <div style={{ display: "grid" }}>
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              style={{
                padding: "10px 14px",
                borderTop: index === 0 ? "none" : "1px solid var(--line)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{exercise.exercise.name}</div>
                {exercise.notes && (
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.45 }}>
                    {exercise.notes}
                  </div>
                )}
              </div>
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 700, textAlign: "right" }}>
                {formatExerciseTarget(exercise)}
              </div>
            </div>
          ))}
        </div>
      )}

      {(block.restAfterSeconds || (pattern !== "endurance_steps" && exercises.length === 0)) && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", background: "rgba(255,255,255,.02)", fontSize: 11, color: "var(--text-mute)" }}>
          {block.restAfterSeconds ? `Después de este bloque descansás ${formatSecondsExact(block.restAfterSeconds)}.` : "Bloque sin ejercicios cargados todavía."}
        </div>
      )}
    </div>
  );
}
