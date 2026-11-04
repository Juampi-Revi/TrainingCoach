import { describe, expect, it } from "vitest";
import { localCalendarDate } from "./local-date";
import { isStaleInProgressSession } from "./stale-sessions.service";

describe("localCalendarDate", () => {
  it("uses the Argentina calendar day, not UTC", () => {
    const lateNightUtc = new Date("2026-11-05T02:30:00.000Z");
    expect(localCalendarDate(lateNightUtc)).toBe("2026-11-04");
  });
});

describe("isStaleInProgressSession", () => {
  it("keeps a session started today open", () => {
    const now = new Date("2026-11-04T21:00:00.000Z");
    const started = new Date("2026-11-04T20:00:00.000Z");
    expect(isStaleInProgressSession({ performedAt: started, updatedAt: started, now })).toBe(false);
  });

  it("keeps a session open across midnight if it was used recently", () => {
    const now = new Date("2026-11-05T03:20:00.000Z");
    const lastSet = new Date("2026-11-05T02:50:00.000Z");
    expect(isStaleInProgressSession({ performedAt: lastSet, updatedAt: lastSet, now })).toBe(false);
  });

  it("closes a leftover session from a previous day after 12h idle", () => {
    const now = new Date("2026-11-05T13:00:00.000Z");
    const started = new Date("2026-11-04T21:00:00.000Z");
    expect(isStaleInProgressSession({ performedAt: started, updatedAt: started, now })).toBe(true);
  });
});
