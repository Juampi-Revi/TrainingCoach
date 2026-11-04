import { describe, expect, it } from "vitest";
import { resolveSessionStatus, staleSessionCloseStatus, summarizeSessionProgress } from "./session-status";

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

  it("discards leftover sessions with no logged sets", () => {
    expect(staleSessionCloseStatus({ setsCount: 0, targetSetsCount: 4 })).toBe("discarded");
  });

  it("closes leftover sessions as partial when some sets were logged", () => {
    expect(staleSessionCloseStatus({ setsCount: 2, targetSetsCount: 6 })).toBe("partial");
  });

  it("closes leftover sessions as completed when every set was logged", () => {
    expect(staleSessionCloseStatus({ setsCount: 6, targetSetsCount: 6 })).toBe("completed");
  });
});
