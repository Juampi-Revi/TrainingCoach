import { describe, expect, it } from "vitest";
import type { SessionExercise } from "@regen/types";
import { isExerciseLogged } from "./session-view";

function exercise(args: {
  type?: "warmup" | "strength" | "intervals" | "cardio" | "cooldown";
  setCount?: number;
  targetSets?: number | null;
}): SessionExercise {
  const emptyLabels = { role: null, effort: null, execution: null };
  return {
    id: "e1",
    sortOrder: 0,
    supersetGroup: null,
    block: { type: args.type ?? "strength" } as SessionExercise["block"],
    exercise: { id: "x", name: "Press", primaryMuscle: null, equipment: null, thumbnailUrl: null },
    media: [],
    alternatives: [],
    target: {
      sets: args.targetSets ?? 3,
      reps: "8",
      durationSeconds: null,
      labels: emptyLabels,
      intensityType: null,
      intensityTarget: null,
      restSeconds: null,
      notes: null,
      groupNote: null,
      groupIsExtra: false,
      groupLabels: emptyLabels,
    },
    sets: Array.from({ length: args.setCount ?? 0 }, (_, i) => ({
      id: `s${i}`,
      setNumber: i + 1,
      reps: 8,
      durationSeconds: null,
      weight: "40",
      rpe: null,
      rir: null,
      notes: null,
    })),
  };
}

describe("isExerciseLogged", () => {
  it("requires logged sets for strength work", () => {
    expect(isExerciseLogged(exercise({ setCount: 2, targetSets: 3 }))).toBe(false);
    expect(isExerciseLogged(exercise({ setCount: 3, targetSets: 3 }))).toBe(true);
  });

  it("counts descanso as done without series", () => {
    expect(isExerciseLogged(exercise({ type: "cooldown", setCount: 0, targetSets: 3 }))).toBe(true);
  });
});
