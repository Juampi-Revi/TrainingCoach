import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHealthOauthState, verifyHealthOauthState } from "./oauth-state";

describe("health oauth state", () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-health-oauth-secret";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it("creates and validates a state for the expected provider", () => {
    const state = createHealthOauthState("user-123", "strava");

    expect(verifyHealthOauthState(state, "strava")).toEqual({
      userId: "user-123",
      provider: "strava",
    });
  });

  it("rejects a state for a different provider", () => {
    const state = createHealthOauthState("user-123", "google_health");

    expect(verifyHealthOauthState(state, "strava")).toBeNull();
  });

  it("rejects an expired state", () => {
    const state = createHealthOauthState("user-123", "strava");

    vi.advanceTimersByTime(10 * 60 * 1000 + 1);

    expect(verifyHealthOauthState(state, "strava")).toBeNull();
  });
});
