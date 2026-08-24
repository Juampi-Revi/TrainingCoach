"use client";

import { useCallback, useRef, useState } from "react";
import { useHistoryStack } from "@/lib/use-history-stack";
import type { WorkoutTemplateDetail } from "@regen/types";
import type { WE } from "../_components/_types";

type Blocks = WorkoutTemplateDetail["blocks"];

export type WorkoutSnap = {
  exercises: WE[];
  blocks: Blocks;
};

function cloneSnap(s: WorkoutSnap): WorkoutSnap {
  return {
    exercises: s.exercises.map((e) => ({
      ...e,
      exercise: { ...e.exercise },
      labels: { ...e.labels },
      groupLabels: { ...e.groupLabels },
    })),
    blocks: s.blocks.map((b) => ({ ...b, labels: { ...b.labels }, steps: [...(b.steps ?? [])] })),
  };
}

type Api = {
  post: <T>(url: string, body: unknown) => Promise<T>;
  put: <T>(url: string, body: unknown) => Promise<T>;
  del: (url: string) => Promise<unknown>;
};

/**
 * Best-effort reconcile: recreate missing blocks/exercises, delete extras, reorder blocks.
 * Caller should reload template after this to refresh ids.
 */
export async function applyWorkoutSnap(
  api: Api,
  templateId: string,
  current: WorkoutSnap,
  target: WorkoutSnap,
): Promise<void> {
  const currentBlockIds = new Set(current.blocks.map((b) => b.id));
  const targetBlockIds = new Set(target.blocks.map((b) => b.id));
  const idMap = new Map<string, string>();

  for (const b of target.blocks) {
    if (currentBlockIds.has(b.id)) {
      idMap.set(b.id, b.id);
      continue;
    }
    const created = await api.post<{ id: string }>(`/coach/workouts/${templateId}/blocks`, {
      type: b.type,
      label: b.label ?? undefined,
      isExtra: b.isExtra,
      roleLabel: b.labels?.role ?? undefined,
      effortLabel: b.labels?.effort ?? undefined,
      executionLabel: b.labels?.execution ?? undefined,
      description: b.description ?? undefined,
      intervalType: b.intervalType ?? undefined,
      prepareSeconds: b.prepareSeconds ?? undefined,
      workSeconds: b.workSeconds ?? undefined,
      restSeconds: b.restSeconds ?? undefined,
      rounds: b.rounds ?? undefined,
      setCount: b.setCount ?? undefined,
      restBetweenSetsSeconds: b.restBetweenSetsSeconds ?? undefined,
      totalDurationSeconds: b.totalDurationSeconds ?? undefined,
      restBetweenExercisesSeconds: b.restBetweenExercisesSeconds ?? undefined,
      targetMinutes: b.targetMinutes ?? undefined,
      targetZone: b.targetZone ?? undefined,
      restAfterSeconds: b.restAfterSeconds ?? undefined,
    });
    idMap.set(b.id, created.id);
  }

  for (const b of current.blocks) {
    if (!targetBlockIds.has(b.id)) {
      await api.del(`/coach/workouts/${templateId}/blocks/${b.id}`);
    }
  }

  const orderedIds = target.blocks.map((b) => idMap.get(b.id)!);
  if (orderedIds.length > 0) {
    await api.put(`/coach/workouts/${templateId}/blocks`, { blockIds: orderedIds });
  }

  const currentExIds = new Set(current.exercises.map((e) => e.id));
  const targetExIds = new Set(target.exercises.map((e) => e.id));

  for (const e of current.exercises) {
    if (!targetExIds.has(e.id) && currentBlockIds.has(e.workoutBlockId) && targetBlockIds.has(e.workoutBlockId)) {
      await api.del(`/coach/workouts/${templateId}/exercises/${e.id}`);
    }
  }

  for (const e of target.exercises) {
    if (currentExIds.has(e.id) && currentBlockIds.has(e.workoutBlockId)) continue;
    const blockId = idMap.get(e.workoutBlockId);
    if (!blockId) continue;
    await api.post(`/coach/workouts/${templateId}/exercises`, {
      exerciseId: e.exercise.id,
      workoutBlockId: blockId,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      durationSeconds: e.durationSeconds,
      restSeconds: e.restSeconds,
      intensityType: e.intensityType,
      intensityTarget: e.intensityTarget,
      notes: e.notes,
      supersetGroup: e.supersetGroup,
      groupNote: e.groupNote,
      groupIsExtra: e.groupIsExtra,
    });
  }
}

export function useWorkoutHistory() {
  const { push, undo, redo, clear, canUndo, canRedo } = useHistoryStack<WorkoutSnap>(20);
  const applyingRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(
    (snap: WorkoutSnap) => {
      if (applyingRef.current) return;
      push(cloneSnap(snap));
    },
    [push],
  );

  const runUndo = useCallback(
    async (current: WorkoutSnap, apply: (next: WorkoutSnap) => Promise<void>) => {
      const prev = undo(cloneSnap(current));
      if (!prev) return false;
      applyingRef.current = true;
      setBusy(true);
      try {
        await apply(prev);
        return true;
      } finally {
        applyingRef.current = false;
        setBusy(false);
      }
    },
    [undo],
  );

  const runRedo = useCallback(
    async (current: WorkoutSnap, apply: (next: WorkoutSnap) => Promise<void>) => {
      const next = redo(cloneSnap(current));
      if (!next) return false;
      applyingRef.current = true;
      setBusy(true);
      try {
        await apply(next);
        return true;
      } finally {
        applyingRef.current = false;
        setBusy(false);
      }
    },
    [redo],
  );

  return {
    capture,
    clear,
    runUndo,
    runRedo,
    canUndo,
    canRedo,
    busy,
  };
}
