import { describe, expect, it } from "vitest";
import { analyzeSet, classifySet, effectiveReps, estimate1rm, summarizeSets } from "./effort";

describe("effort classification", () => {
  it("counts warmup blocks as warmup even with high RPE", () => {
    expect(classifySet({ reps: 10, weight: 40, rpe: 8, rir: 2, blockType: "warmup" })).toBe("warmup");
  });

  it("treats RPE 8 / RIR 2 as stimulating", () => {
    expect(classifySet({ reps: 8, weight: 80, rpe: 8, rir: null, blockType: "strength" })).toBe("stimulating");
  });

  it("treats RPE 5 as filler/warmup", () => {
    expect(classifySet({ reps: 12, weight: 50, rpe: 5, rir: null, blockType: "strength" })).toBe("warmup");
    expect(classifySet({ reps: 12, weight: 50, rpe: 6, rir: 4, blockType: "strength" })).toBe("filler");
  });

  it("estimates effective reps from RIR", () => {
    expect(effectiveReps(10, 3)).toBe(2);
    expect(effectiveReps(10, 1)).toBe(4);
    expect(effectiveReps(10, 0)).toBe(5);
    expect(effectiveReps(3, 0)).toBe(3);
  });

  it("estimates 1RM with Epley + RIR", () => {
    expect(estimate1rm(80, 6, 2)).toBe(101.3);
  });

  it("summarizes a mixed session", () => {
    const summary = summarizeSets([
      { reps: 10, weight: 40, rpe: 5, rir: null, blockType: "warmup", muscle: "chest" },
      { reps: 8, weight: 80, rpe: 8, rir: null, blockType: "strength", muscle: "chest" },
      { reps: 8, weight: 80, rpe: 8.5, rir: null, blockType: "strength", muscle: "chest" },
      { reps: 10, weight: 20, rpe: 6, rir: 4, blockType: "strength", muscle: "chest" },
    ]);
    expect(summary.stimulatingSets).toBe(2);
    expect(summary.fillerSets).toBe(1);
    expect(summary.warmupSets).toBe(1);
    expect(summary.byMuscle[0]?.muscle).toBe("chest");
  });

  it("returns unknown without effort", () => {
    expect(analyzeSet({ reps: 8, weight: 60, rpe: null, rir: null }).kind).toBe("unknown");
  });
});
