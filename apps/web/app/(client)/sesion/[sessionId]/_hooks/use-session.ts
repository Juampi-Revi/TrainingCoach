"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { SessionDetail } from "@regen/types";
import type { OfflineItem } from "../_components/_types";

export function useSession(sessionId: string) {
  const { api } = useAuth();
  const router = useRouter();

  const queueKey = `regen_offline_${sessionId}`;
  const warmupDoneKey = `regen_warmup_done_${sessionId}`;
  const warmupTimerKey = `regen_warmup_timer_${sessionId}`;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [didInitIdx, setDidInitIdx] = useState(false);
  const [workoutStartedAtMs, setWorkoutStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [sessionNotes, setSessionNotes] = useState("");
  const [warmupDone, setWarmupDone] = useState(true);
  const [warmupTimer, setWarmupTimer] = useState<{ accMs: number; runningSince: number | null }>({ accMs: 0, runningSince: null });

  useEffect(() => {
    const id0 = setTimeout(() => setNowMs(Date.now()), 0);
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => { clearTimeout(id0); clearInterval(id); };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(queueKey);
        setOfflineCount(stored ? (JSON.parse(stored) as unknown[]).length : 0);
      } catch { setOfflineCount(0); }
    }, 0);
    return () => clearTimeout(id);
  }, [queueKey]);

  const load = useCallback(() => {
    api.get<SessionDetail>(`/client/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        setSessionNotes(s.sessionNotes ?? "");
        setWorkoutStartedAtMs(new Date(s.performedAt).getTime());
        if (!didInitIdx) {
          setDidInitIdx(true);
          // Find first exercise not in a warmup block
          const firstWorkIdx = s.exercises.findIndex((e) => e.block.type !== "warmup");
          if (firstWorkIdx >= 0) setCurrentExIdx(firstWorkIdx);
        }
        if (s.status === "completed") router.replace(`/sesion/${sessionId}/completada`);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, didInitIdx, sessionId, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!session) return;
    // Check if there's a warmup block by looking at exercise blocks
    const hasWarmup = session.exercises.some((e) => e.block.type === "warmup");
    const id = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(id);
  }, [session, warmupDoneKey, warmupTimerKey]);

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

  const flushQueue = useCallback(async () => {
    try {
      const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
      if (!queue.length) return;
      const remaining: OfflineItem[] = [];
      for (const item of queue) {
        try {
          await api.put(`/client/sessions/${sessionId}/exercises/${item.wseId}/sets/${item.setNumber}`, item.body);
        } catch { remaining.push(item); }
      }
      localStorage.setItem(queueKey, JSON.stringify(remaining));
      setOfflineCount(remaining.length);
      if (remaining.length < queue.length) load();
    } catch {}
  }, [queueKey, sessionId, load, api]);

  useEffect(() => {
    const id = setTimeout(() => { void flushQueue(); }, 0);
    window.addEventListener("online", flushQueue);
    return () => { clearTimeout(id); window.removeEventListener("online", flushQueue); };
  }, [flushQueue]);

  const saveNotes = useCallback(async (notes: string) => {
    try { await api.patch(`/client/sessions/${sessionId}`, { sessionNotes: notes || null }); }
    catch (e) { console.error(e); }
  }, [api, sessionId]);

  return {
    session, setSession, loading,
    currentExIdx, setCurrentExIdx,
    workoutStartedAtMs, nowMs,
    offlineCount, setOfflineCount,
    sessionNotes, setSessionNotes,
    warmupDone, setWarmupDone,
    warmupTimer,
    queueKey, warmupDoneKey, warmupTimerKey,
    load, flushQueue, saveNotes,
    toggleWarmup, resetWarmup, finishWarmup,
  };
}
