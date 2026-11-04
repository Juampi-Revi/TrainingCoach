import { describe, expect, it } from "vitest";
import { localCalendarDate } from "./local-date";

describe("localCalendarDate", () => {
  it("uses the Argentina calendar day, not UTC", () => {
    const lateNightUtc = new Date("2026-11-05T02:30:00.000Z");
    expect(localCalendarDate(lateNightUtc)).toBe("2026-11-04");
  });
});
