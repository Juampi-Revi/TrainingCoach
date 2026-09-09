import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry, isNetworkError, isRetryableStatus } from "./api-fetch";

describe("isRetryableStatus", () => {
  it("retries network and gateway failures", () => {
    expect(isRetryableStatus(0)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
  });
});

describe("isNetworkError", () => {
  it("detects errors with status 0", () => {
    expect(isNetworkError({ status: 0 })).toBe(true);
    expect(isNetworkError({ status: 500 })).toBe(false);
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first successful response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://example.com", { method: "GET" }, { delaysMs: [0] });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a thrown fetch and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://example.com", { method: "PATCH" }, { delaysMs: [0] });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries 502 then returns the next ok response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad", { status: 502 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://example.com", { method: "PATCH" }, { delaysMs: [0] });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
