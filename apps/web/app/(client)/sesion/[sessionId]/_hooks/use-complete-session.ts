"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { NETWORK_ERROR_MESSAGE, isNetworkError } from "@/lib/api-fetch";
import {
  clearPendingComplete,
  isClosedSessionStatus,
  readPendingComplete,
  savePendingComplete,
} from "../_lib/session-complete";

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

  const goToDone = useCallback(() => {
    clearPendingComplete(sessionId);
    router.replace(`/sesion/${sessionId}/completada`);
  }, [router, sessionId]);

  const alreadyClosed = useCallback(async () => {
    try {
      const current = await api.get<{ status: string }>(`/client/sessions/${sessionId}`);
      return isClosedSessionStatus(current.status);
    } catch {
      return false;
    }
  }, [api, sessionId]);

  const completeSession = useCallback(async (sessionNotes?: string) => {
    if (inflight.current) return;
    inflight.current = true;
    setCompleting(true);
    try {
      let remaining = await flushQueue();
      if (remaining > 0) remaining = await flushQueue();
      if (remaining > 0) {
        if (await alreadyClosed()) { goToDone(); return; }
        toast.error("Todavía hay series pendientes. Revisá tu conexión y reintentá Finalizar.");
        setCompleting(false);
        return;
      }
      await api.patch(`/client/sessions/${sessionId}`, {
        status: "completed",
        ...(sessionNotes ? { sessionNotes } : {}),
      }, { timeoutMs: 25_000, delaysMs: [] });
      goToDone();
    } catch (e) {
      if (await alreadyClosed()) { goToDone(); return; }
      if (isNetworkError(e)) {
        savePendingComplete(sessionId, sessionNotes);
        toast.error(`${NETWORK_ERROR_MESSAGE} Tus series están guardadas.`);
      } else {
        toast.error(e instanceof Error ? e.message : "No se pudo cerrar la sesión");
      }
      setCompleting(false);
    } finally {
      inflight.current = false;
    }
  }, [alreadyClosed, api, flushQueue, goToDone, sessionId, toast]);

  useEffect(() => {
    const pending = readPendingComplete(sessionId);
    if (pending) void completeSession(pending.sessionNotes);

    const onOnline = () => {
      const next = readPendingComplete(sessionId);
      if (next) void completeSession(next.sessionNotes);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [completeSession, sessionId]);

  return { completing, completeSession };
}
