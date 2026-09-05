import { groupLabel } from "@/lib/constants";
import { isSessionExerciseExtra } from "@/lib/workout-labels";
import type { SessionDetail, SessionExercise } from "@regen/types";

export function sessionWorkSplit(session: SessionDetail) {
  const warmupExercises = session.exercises.filter((e) => e.block?.type === "warmup");
  const workExercises = session.exercises.filter((e) => e.block?.type !== "warmup");
  const requiredExercises = workExercises.filter((e) => !isSessionExerciseExtra(e));
  const completedExs = requiredExercises.filter((e) => e.sets.length >= (e.target?.sets ?? 3)).length;
  const extraBlockCount = (session.blocks ?? []).filter((block) => block.isExtra).length;
  const extraGroupCount = Array.from(
    new Set(
      workExercises
        .filter((item) => item.supersetGroup && item.target?.groupIsExtra)
        .map((item) => `${item.block?.id ?? "block"}:${item.supersetGroup}`),
    ),
  ).length;
  return { warmupExercises, workExercises, requiredExercises, completedExs, extraBlockCount, extraGroupCount };
}

export function exerciseSubtitle(ex: SessionExercise | undefined, workExercises: SessionExercise[]): string | undefined {
  if (!ex) return undefined;
  const groupSizes = workExercises.reduce<Record<string, number>>((acc, e) => {
    if (e.supersetGroup) acc[e.supersetGroup] = (acc[e.supersetGroup] ?? 0) + 1;
    return acc;
  }, {});
  const parts: string[] = [];
  const isInterval = ex.block.type === "intervals";
  if (ex.supersetGroup) parts.push(`${ex.supersetGroup} · ${groupLabel(groupSizes[ex.supersetGroup] ?? 1).toUpperCase()}`);
  if (ex.target?.sets && !isInterval) parts.push(`${ex.target.sets} series`);
  if (ex.target?.intensityType && ex.target?.intensityTarget) {
    parts.push(`${ex.target.intensityType.toUpperCase()} ${ex.target.intensityTarget}`);
  }
  return parts.length ? parts.join(" · ") : undefined;
}
