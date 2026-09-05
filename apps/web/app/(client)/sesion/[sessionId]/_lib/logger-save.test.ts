import { describe, expect, it } from "vitest";
import type { SessionExercise } from "@regen/types";
import type { SheetRow } from "../_components/_types";
import {
  autofillNextRow,
  isTimedExercise,
  rowHasData,
  setPayloadFromRow,
  shouldPersistRow,
} from "./logger-save";

const repsEx = { target: { reps: 10, sets: 3 } } as unknown as SessionExercise;
const timedEx = { target: { durationSeconds: 45, sets: 3 } } as unknown as SessionExercise;

describe("rowHasData", () => {
  it("ignores reps on timed exercises", () => {
    const row: SheetRow = { setNumber: 1, reps: "10", duration: "", kg: "", effort: "" };
    expect(rowHasData(row, true)).toBe(false);
    expect(rowHasData(row, false)).toBe(true);
  });

  it("counts duration on timed exercises", () => {
    const row: SheetRow = { setNumber: 1, reps: "", duration: "45", kg: "", effort: "" };
    expect(rowHasData(row, true)).toBe(true);
  });
});

describe("shouldPersistRow", () => {
  it("skips saved rows that were not edited", () => {
    const row: SheetRow = { setNumber: 1, reps: "8", duration: "", kg: "60", effort: "8", isSaved: true, isDirty: false };
    expect(shouldPersistRow(row, false)).toBe(false);
  });

  it("persists dirty rows with data", () => {
    const row: SheetRow = { setNumber: 1, reps: "8", duration: "", kg: "60", effort: "8", isDirty: true };
    expect(shouldPersistRow(row, false)).toBe(true);
  });

  it("does not persist placeholder-only rows", () => {
    const row: SheetRow = {
      setNumber: 1,
      reps: "",
      duration: "",
      kg: "",
      effort: "",
      repsPlaceholder: "10",
      kgPlaceholder: "60",
    };
    expect(shouldPersistRow(row, false)).toBe(false);
  });
});

describe("setPayloadFromRow", () => {
  it("does not send reps for timed exercises", () => {
    const row: SheetRow = { setNumber: 1, reps: "10", duration: "45", kg: "20", effort: "7" };
    const body = setPayloadFromRow(row, true, "RPE", null);
    expect(body).toEqual({ weight: "20", durationSeconds: "45", rpe: "7" });
  });

  it("does not send duration for rep-based exercises", () => {
    const row: SheetRow = { setNumber: 1, reps: "10", duration: "45", kg: "60", effort: "8" };
    const body = setPayloadFromRow(row, false, "RPE", "barra");
    expect(body).toEqual({ weight: "60", reps: "10", rpe: "8", notes: "barra" });
  });
});

describe("autofillNextRow", () => {
  it("updates placeholders on the next empty row without filling values", () => {
    const rows: SheetRow[] = [
      { setNumber: 1, reps: "8", duration: "", kg: "60", effort: "8", isSaved: true },
      { setNumber: 2, reps: "", duration: "", kg: "", effort: "" },
    ];
    const next = autofillNextRow(rows, rows[0]!, "RPE", false);
    expect(next[1]).toMatchObject({
      reps: "",
      kg: "",
      repsPlaceholder: "8",
      kgPlaceholder: "60",
      effortPlaceholder: "8",
    });
  });
});

describe("isTimedExercise", () => {
  it("detects timed targets", () => {
    expect(isTimedExercise(timedEx)).toBe(true);
    expect(isTimedExercise(repsEx)).toBe(false);
  });
});
