"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { SessionDetail } from "@regen/types";
import { useWarmupTimer } from "./use-warmup-timer";
import { useOfflineQueue } from "./use-offline-queue";

const STALE_SESSION_MS = 4 * 60 * 60 * 1000;

function resolveSessionClockStart(clockKey: string, performedAt: string): number {
  try {
    const stored = window.localStorage.getItem(clockKey);
    if (stored) {
      const n = Number(stored);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch { /* ignore */ }

  const performed = new Date(performedAt).getTime();
  const age = Date.now() - performed;
  const start = Number.isFinite(performed) && age >= 0 && age < STALE_SESSION_MS
    ? performed
    : Date.now();
  try { window.localStorage.setItem(clockKey, String(start)); } catch { /* ignore */ }
  return start;
}

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

  const {
    warmupDone, setWarmupDone,
    warmupTimer, setWarmupTimer,
    loadWarmupState, toggleWarmup, resetWarmup, finishWarmup,
  } = useWarmupTimer(warmupDoneKey, warmupTimerKey);

  const clockKey = `regen_session_clock_${sessionId}`;

  const load = useCallback(() => {
    api.get<SessionDetail>(`/client/sessions/${sessionId}`)
      .then((s) => {
        const normalized: SessionDetail = {
          ...s,
          blocks: s.blocks ?? [],
          exercises: s.exercises ?? [],
          activities: s.activities ?? [],
        };
        setSession(normalized);
        setWorkoutStartedAtMs(resolveSessionClockStart(clockKey, normalized.performedAt));
        if (!didInitIdx) {
          setDidInitIdx(true);
          const firstWorkIdx = normalized.exercises.findIndex((e) => e.block?.type !== "warmup");
          if (firstWorkIdx >= 0) setCurrentExIdx(firstWorkIdx);
        }
        if (normalized.status === "completed" || normalized.status === "partial") {
          router.replace(`/sesion/${sessionId}/completada`);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, didInitIdx, sessionId, router, clockKey]);

  const { flushQueue } = useOfflineQueue({ sessionId, queueKey, setOfflineCount, load });

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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!session) return;
    const hasWarmup = session.exercises.some((e) => e.block?.type === "warmup");
    const id = setTimeout(() => loadWarmupState(hasWarmup), 0);
    return () => clearTimeout(id);
  }, [session, loadWarmupState]);

  return {
    session, setSession, loading,
    currentExIdx, setCurrentExIdx,
    workoutStartedAtMs, nowMs,
    offlineCount, setOfflineCount,
    warmupDone, setWarmupDone,
    warmupTimer, setWarmupTimer,
    queueKey, warmupDoneKey, warmupTimerKey, clockKey,
    load, flushQueue,
    toggleWarmup, resetWarmup, finishWarmup,
  };
}
