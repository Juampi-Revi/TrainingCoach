"use client";

import { useState, useEffect, useCallback } from "react";

export function useWarmupTimer(warmupDoneKey: string, warmupTimerKey: string) {
  const [warmupDone, setWarmupDone] = useState(true);
  const [warmupTimer, setWarmupTimer] = useState<{ accMs: number; runningSince: number | null }>({ accMs: 0, runningSince: null });

  const loadWarmupState = useCallback((hasWarmup: boolean) => {
    if (!hasWarmup) { setWarmupDone(true); return; }
    let done = false;
    try { done = window.localStorage.getItem(warmupDoneKey) === "1"; } catch {}
    setWarmupDone(done);
    try {
      const raw = window.localStorage.getItem(warmupTimerKey);
      if (!raw) { setWarmupTimer({ accMs: 0, runningSince: null }); return; }
      const parsed = JSON.parse(raw) as { accMs?: unknown; runningSince?: unknown };
      setWarmupTimer({ accMs: typeof parsed.accMs === "number" ? parsed.accMs : 0, runningSince: null });
    } catch { setWarmupTimer({ accMs: 0, runningSince: null }); }
  }, [warmupDoneKey, warmupTimerKey]);

  useEffect(() => {
    if (warmupTimer.runningSince == null) return;
    return () => {
      setWarmupTimer((prev) => {
        if (prev.runningSince == null) return prev;
        const now = Date.now();
        const next = { accMs: prev.accMs + (now - prev.runningSince), runningSince: now };
        try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
        return next;
      });
    };
  }, [warmupTimer.runningSince, warmupTimerKey]);

  const toggleWarmup = useCallback(() => {
    setWarmupTimer((prev) => {
      const now = Date.now();
      const next = prev.runningSince == null
        ? { ...prev, runningSince: now }
        : { accMs: prev.accMs + (now - prev.runningSince), runningSince: null as number | null };
      try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [warmupTimerKey]);

  const resetWarmup = useCallback(() => {
    const next = { accMs: 0, runningSince: null as number | null };
    try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
    setWarmupTimer(next);
  }, [warmupTimerKey]);

  const finishWarmup = useCallback(() => {
    try { window.localStorage.setItem(warmupDoneKey, "1"); } catch {}
    setWarmupDone(true);
    setWarmupTimer((prev) => {
      const now = Date.now();
      const next = { accMs: prev.accMs + (prev.runningSince ? now - prev.runningSince : 0), runningSince: null as number | null };
      try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [warmupDoneKey, warmupTimerKey]);

  return { warmupDone, setWarmupDone, warmupTimer, setWarmupTimer, loadWarmupState, toggleWarmup, resetWarmup, finishWarmup };
}
