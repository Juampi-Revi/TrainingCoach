import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}));

import { getFriendsLeaderboard } from "./leaderboard.service";

describe("getFriendsLeaderboard", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset();
  });

  it("includes the current user plus friends and ranks by value", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ followingId: "friend-1" }])
      .mockResolvedValueOnce([
        { userId: "me", name: "Yo", avatarUrl: null, value: 2 },
        { userId: "friend-1", name: "Ana", avatarUrl: null, value: 8 },
      ]);

    const result = await getFriendsLeaderboard("me", "workouts", "weekly", 20);

    expect(result.entries.map((e) => e.userId)).toEqual(["friend-1", "me"]);
    expect(result.entries[0]?.rank).toBe(1);
    expect(result.currentUserRank).toBe(2);
    expect(result.currentUserValue).toBe(2);
    expect(result.totalParticipants).toBe(2);
  });

  it("uses Prisma.join for the friends IN filter (not string concat)", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ followingId: "friend-1" }, { followingId: "friend-2" }])
      .mockResolvedValueOnce([]);

    await getFriendsLeaderboard("me", "xp", "allTime", 10);

    expect(mocks.queryRaw).toHaveBeenCalledTimes(2);
    const metricCall = mocks.queryRaw.mock.calls[1] ?? [];
    const interpolated = metricCall.slice(1);
    expect(interpolated.some((arg) => arg && typeof arg === "object")).toBe(true);
    expect(interpolated.some((arg) => typeof arg === "string" && arg.includes("friend-1"))).toBe(false);
  });
});
