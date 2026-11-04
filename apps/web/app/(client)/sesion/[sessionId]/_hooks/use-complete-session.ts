"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { clearPendingComplete, savePendingComplete } from "../_lib/session-complete";

export function useCompleteSession({
  sessionId,
  flushQueue,
}: {
  sessionId: string;
  flushQueue: () => Promise<number>;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const inflight = useRef(false);

  const closeOnServer = useCallback(async (sessionNotes?: string) => {
    await api.patch(`/client/sessions/${sessionId}`, {
      status: "completed",
      ...(sessionNotes ? { sessionNotes } : {}),
    }, { timeoutMs: 20_000, delaysMs: [] });
    clearPendingComplete(sessionId);
  }, [api, sessionId]);

  const completeSession = useCallback(async (sessionNotes?: string) => {
    if (inflight.current) return;
    inflight.current = true;
    setCompleting(true);
    try {
      await Promise.race([
        flushQueue().catch(() => 0),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 8000)),
      ]);
      try {
        await closeOnServer(sessionNotes);
      } catch {
        savePendingComplete(sessionId, sessionNotes);
        await closeOnServer(sessionNotes);
      }
      router.replace(`/sesion/${sessionId}/completada`);
    } catch (e) {
      savePendingComplete(sessionId, sessionNotes);
      toast.error(e instanceof Error ? e.message : "No se pudo cerrar la sesión. Reintentá Finalizar.");
      setCompleting(false);
    } finally {
      inflight.current = false;
    }
  }, [closeOnServer, flushQueue, router, sessionId, toast]);

  return { completing, completeSession };
}
