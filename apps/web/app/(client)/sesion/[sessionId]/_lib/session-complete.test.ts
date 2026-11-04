import { describe, expect, it, vi, afterEach } from "vitest";
import { clearPendingComplete, isClosedSessionStatus, isNetworkCloseError, readPendingComplete, savePendingComplete } from "./session-complete";

describe("session-complete queue", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips pending complete payload", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
    savePendingComplete("sess-1", "buena pata");
    expect(readPendingComplete("sess-1")).toEqual({ sessionNotes: "buena pata" });
    savePendingComplete("sess-2", { preventDefault() { /* click event */ } } as unknown as string);
    expect(readPendingComplete("sess-2")).toEqual({});
    clearPendingComplete("sess-1");
    expect(readPendingComplete("sess-1")).toBeNull();
  });

  it("treats completed and partial as already closed", () => {
    expect(isClosedSessionStatus("completed")).toBe(true);
    expect(isClosedSessionStatus("partial")).toBe(true);
    expect(isClosedSessionStatus("in_progress")).toBe(false);
  });

  it("detects a network failure when closing", () => {
    expect(isNetworkCloseError({ status: 0, message: "offline" })).toBe(true);
    expect(isNetworkCloseError({ status: 400, message: "bad" })).toBe(false);
  });
});
