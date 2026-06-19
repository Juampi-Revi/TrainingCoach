"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import type { OfflineItem } from "../_components/_types";

export function useOfflineQueue({
  sessionId,
  queueKey,
  setOfflineCount,
  load,
}: {
  sessionId: string;
  queueKey: string;
  setOfflineCount: (n: number) => void;
  load: () => void;
}) {
  const { api } = useAuth();

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
  }, [queueKey, sessionId, load, api, setOfflineCount]);

  useEffect(() => {
    const id = setTimeout(() => { void flushQueue(); }, 0);
    window.addEventListener("online", flushQueue);
    return () => { clearTimeout(id); window.removeEventListener("online", flushQueue); };
  }, [flushQueue]);

  return { flushQueue };
}
