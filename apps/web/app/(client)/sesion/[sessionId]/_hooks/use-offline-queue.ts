"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  countOfflineSets,
  deleteOfflineSet,
  enqueueOfflineSet,
  listOfflineSets,
  migrateLegacyQueue,
} from "../_lib/offline-idb";

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

  const refreshCount = useCallback(async () => {
    try {
      setOfflineCount(await countOfflineSets(sessionId));
    } catch {
      setOfflineCount(0);
    }
  }, [sessionId, setOfflineCount]);

  const enqueue = useCallback(
    async (item: { wseId: string; setNumber: number; body: Record<string, string> }) => {
      await enqueueOfflineSet({ sessionId, ...item });
      await refreshCount();
    },
    [sessionId, refreshCount],
  );

  const flushQueue = useCallback(async () => {
    try {
      await migrateLegacyQueue(sessionId, queueKey);
      const queue = await listOfflineSets(sessionId);
      if (!queue.length) {
        setOfflineCount(0);
        return 0;
      }
      let remaining = 0;
      let flushed = 0;
      for (const item of queue) {
        try {
          await api.put(`/client/sessions/${sessionId}/exercises/${item.wseId}/sets/${item.setNumber}`, item.body);
          if (item.id != null) await deleteOfflineSet(item.id);
          flushed += 1;
        } catch {
          remaining += 1;
        }
      }
      setOfflineCount(remaining);
      if (flushed > 0) load();
      return remaining;
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }, [queueKey, sessionId, load, api, setOfflineCount]);

  useEffect(() => {
    void migrateLegacyQueue(sessionId, queueKey).then(() => refreshCount());
    const id = setTimeout(() => { void flushQueue(); }, 0);
    window.addEventListener("online", flushQueue);
    return () => { clearTimeout(id); window.removeEventListener("online", flushQueue); };
  }, [flushQueue, queueKey, refreshCount, sessionId]);

  return { flushQueue, enqueue };
}
