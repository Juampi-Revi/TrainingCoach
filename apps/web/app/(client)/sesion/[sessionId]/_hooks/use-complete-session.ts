"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
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

  const leaveLogger = useCallback(() => {
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

  const closeOnServer = useCallback(async (sessionNotes?: string) => {
    await api.patch(`/client/sessions/${sessionId}`, {
      status: "completed",
      ...(sessionNotes ? { sessionNotes } : {}),
    }, { timeoutMs: 15_000, delaysMs: [] });
    clearPendingComplete(sessionId);
  }, [api, sessionId]);

  const completeSession = useCallback(async (sessionNotes?: string) => {
    if (inflight.current) return;
    inflight.current = true;
    setCompleting(true);
    try {
      let remaining = await flushQueue();
      if (remaining > 0) remaining = await flushQueue();
      if (remaining > 0) {
        if (await alreadyClosed()) {
          clearPendingComplete(sessionId);
          leaveLogger();
          return;
        }
        toast.error("No se pudieron subir todas las series. Reintentá Finalizar.");
        setCompleting(false);
        return;
      }
      try {
        await closeOnServer(sessionNotes);
      } catch {
        savePendingComplete(sessionId, sessionNotes);
      }
      leaveLogger();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cerrar la sesión");
      setCompleting(false);
    } finally {
      inflight.current = false;
    }
  }, [alreadyClosed, closeOnServer, flushQueue, leaveLogger, sessionId, toast]);

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
