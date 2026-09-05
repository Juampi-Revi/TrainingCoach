import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  aggregate: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coachClient: { findFirst: mocks.findFirst },
    user: { findUnique: mocks.findUnique },
    workoutSet: { aggregate: mocks.aggregate },
  },
}));

vi.mock("@/lib/notify", () => ({ notify: mocks.notify }));

import { notifyCoachSessionCompleted } from "./session-notify";

describe("notifyCoachSessionCompleted", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
    mocks.findUnique.mockReset();
    mocks.aggregate.mockReset();
    mocks.notify.mockReset();
  });

  it("does nothing when the client has no coach", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await notifyCoachSessionCompleted({
      clientUserId: "c1",
      sessionId: "s1",
      workoutTitle: "Upper",
      energyRating: 4,
    });

    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("notifies the coach with RPE and context", async () => {
    mocks.findFirst.mockResolvedValue({ coachUserId: "coach-1" });
    mocks.findUnique.mockResolvedValue({ displayName: "Juan", email: "j@x.com" });
    mocks.aggregate.mockResolvedValue({ _avg: { rpe: 8.24 } });

    await notifyCoachSessionCompleted({
      clientUserId: "c1",
      sessionId: "s1",
      workoutTitle: "Upper Body",
      energyRating: 5,
    });

    expect(mocks.notify).toHaveBeenCalledWith({
      userId: "coach-1",
      type: "session_completed",
      title: "Juan completó Upper Body con RPE 8.2",
      body: "Energía 5/5",
      linkUrl: "/coach/alumnos/c1/sesiones/s1",
      context: {
        clientUserId: "c1",
        clientName: "Juan",
        sessionId: "s1",
        workoutTitle: "Upper Body",
        rpe: 8.2,
      },
    });
  });
});
