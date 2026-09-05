import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashRefreshToken } from "@/lib/jwt";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
  },
}));

import {
  cleanupExpiredTokens,
  createRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
} from "./refresh-token.service";

describe("refresh-token.service", () => {
  beforeEach(() => {
    mocks.update.mockReset();
    mocks.updateMany.mockReset();
    mocks.update.mockResolvedValue({});
    mocks.updateMany.mockResolvedValue({ count: 2 });
  });

  it("stores a hashed refresh token and returns the raw token", async () => {
    const first = await createRefreshToken("user-1");

    expect(first.token.length).toBeGreaterThan(20);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        refreshToken: hashRefreshToken(first.token),
        refreshTokenExpiry: first.expiresAt,
      },
    });
  });

  it("rotates so a previous token hash is no longer stored", async () => {
    const first = await createRefreshToken("user-1");
    const second = await createRefreshToken("user-1");

    expect(first.token).not.toBe(second.token);
    const lastCall = mocks.update.mock.calls.at(-1)?.[0] as {
      data: { refreshToken: string };
    };
    expect(lastCall.data.refreshToken).toBe(hashRefreshToken(second.token));
    expect(lastCall.data.refreshToken).not.toBe(hashRefreshToken(first.token));
  });

  it("revokes the stored refresh token", async () => {
    await revokeRefreshToken("user-1");
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { refreshToken: null, refreshTokenExpiry: null },
    });
  });

  it("logout-all uses the same revocation", async () => {
    await revokeAllUserTokens("user-1");
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { refreshToken: null, refreshTokenExpiry: null },
    });
  });

  it("clears expired tokens", async () => {
    const cleared = await cleanupExpiredTokens();
    expect(cleared).toBe(2);
    expect(mocks.updateMany).toHaveBeenCalled();
  });
});
