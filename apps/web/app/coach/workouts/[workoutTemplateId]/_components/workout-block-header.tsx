"use client";

import { Button, Icon } from "@/components/ui";
import { blockTypeLabel } from "@/lib/constants";
import { blockCoachSummary, blockPatternLabel } from "@/lib/training-blocks";
import type { WorkoutTemplateDetail } from "@regen/types";
import { WorkoutLabelChips } from "@/components/features/training/workout-label-chips";

interface WorkoutBlockHeaderProps {
  b: WorkoutTemplateDetail["blocks"][number];
  bIdx: number;
  blocksSorted: WorkoutTemplateDetail["blocks"];
  exercises: WorkoutTemplateDetail["exercises"];
  onReorder: (next: WorkoutTemplateDetail["blocks"]) => void;
  onEdit: () => void;
  onLibrary: () => void;
  onAddExercise: () => void;
}

export function WorkoutBlockHeader({
  b,
  bIdx,
  blocksSorted,
  exercises,
  onReorder,
  onEdit,
  onLibrary,
  onAddExercise,
}: WorkoutBlockHeaderProps) {
  const blockExercises = exercises
    .filter((e) => e.workoutBlockId === b.id)
    .sort((a, c) => a.sortOrder - c.sortOrder);
  const canMoveUp = bIdx > 0;
  const canMoveDown = bIdx < blocksSorted.length - 1;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-2)" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: b.type === "warmup" ? "rgba(234,179,8,.12)" : b.type === "cooldown" ? "rgba(255,255,255,.08)" : b.type === "cardio" ? "rgba(255,255,255,.08)" : "rgba(215,255,58,.12)",
        border: `1px solid ${b.type === "warmup" ? "rgba(234,179,8,.25)" : b.type === "cooldown" ? "rgba(255,255,255,.15)" : b.type === "cardio" ? "rgba(255,255,255,.15)" : "rgba(215,255,58,.25)"}`,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon
          name={b.type === "warmup" ? "flame" : b.type === "cooldown" ? "moon" : b.type === "cardio" ? "repeat" : b.type === "intervals" ? "timer" : "dumbbell"}
          size={14}
          color={b.type === "warmup" ? "var(--warn)" : b.type === "cooldown" ? "var(--text-mute)" : b.type === "cardio" ? "var(--text-mute)" : "var(--lime)"}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ta-mono" style={{
          fontSize: 10, fontWeight: 800,
          color: b.type === "warmup" ? "var(--warn)" : b.type === "cooldown" ? "var(--text-mute)" : b.type === "cardio" ? "var(--text-mute)" : "var(--lime)",
          letterSpacing: ".08em"
        }}>
          {blockTypeLabel(b.type, b.intervalType).toUpperCase()} {b.label ? `· ${b.label}` : ""}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          {blockPatternLabel(b)} · {blockCoachSummary(b)}
          <span style={{ margin: "0 6px" }}>·</span>
          {blockExercises.length} ejercicio{blockExercises.length === 1 ? "" : "s"}
          {b.restBetweenExercisesSeconds ? ` · descanso ${b.restBetweenExercisesSeconds}s` : ""}
          {b.restAfterSeconds ? ` · descanso post ${b.restAfterSeconds}s` : ""}
        </div>
        <div style={{ marginTop: 6 }}>
          <WorkoutLabelChips labels={b.labels} isExtra={b.isExtra} compact />
        </div>
        {b.description && (
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2, fontStyle: "italic" }}>
            {b.description}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="ghost" size="sm" icon="chevUp" title="Mover bloque arriba" ariaLabel="Mover bloque arriba" disabled={!canMoveUp} onClick={() => { if (!canMoveUp) return; const next = [...blocksSorted]; const swapIdx = bIdx - 1; [next[bIdx], next[swapIdx]] = [next[swapIdx]!, next[bIdx]!]; void onReorder(next); }} />
        <Button variant="ghost" size="sm" icon="chevD" title="Mover bloque abajo" ariaLabel="Mover bloque abajo" disabled={!canMoveDown} onClick={() => { if (!canMoveDown) return; const next = [...blocksSorted]; const swapIdx = bIdx + 1; [next[bIdx], next[swapIdx]] = [next[swapIdx]!, next[bIdx]!]; void onReorder(next); }} />
        <Button variant="outline" size="sm" onClick={onEdit}>
          Configurar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="book"
          onClick={onLibrary}
        >
          Biblioteca
        </Button>
        <Button variant="ghost" size="sm" icon="plus" onClick={onAddExercise}>
          Ejercicio
        </Button>
      </div>
    </div>
  );
}
