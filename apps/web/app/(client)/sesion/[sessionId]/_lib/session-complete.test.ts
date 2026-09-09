import { describe, expect, it, vi, afterEach } from "vitest";
import { clearPendingComplete, readPendingComplete, savePendingComplete } from "./session-complete";

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
    clearPendingComplete("sess-1");
    expect(readPendingComplete("sess-1")).toBeNull();
  });
});
