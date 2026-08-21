import { describe, expect, it } from "vitest";
import { resolveSessionStatus, summarizeSessionProgress } from "./session-status";

describe("session-status", () => {
  it("marks completed sessions as partial when sets are still missing", () => {
    const summary = summarizeSessionProgress([
      {
        _count: { sets: 2 },
        workoutExercise: {
          targetSets: 3,
          workoutBlock: { type: "strength" },
        },
      },
    ]);

    expect(resolveSessionStatus("completed", summary)).toBe("partial");
  });

  it("keeps fully logged sessions as completed", () => {
    const summary = summarizeSessionProgress([
      {
        sets: [{}, {}, {}],
        workoutExercise: {
          targetSets: 3,
          workoutBlock: { type: "strength" },
        },
      },
    ]);

    expect(resolveSessionStatus("completed", summary)).toBe("completed");
  });
});
