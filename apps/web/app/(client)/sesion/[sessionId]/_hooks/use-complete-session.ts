"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { NETWORK_ERROR_MESSAGE, isNetworkError } from "@/lib/api-fetch";
import {
  clearPendingComplete,
  readPendingComplete,
  savePendingComplete,
} from "../_lib/session-complete";

export function useCompleteSession({
  sessionId,
  flushQueue,
  load,
}: {
  sessionId: string;
  flushQueue: () => Promise<number>;
  load: () => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const inflight = useRef(false);

  const completeSession = useCallback(async (sessionNotes?: string) => {
    if (inflight.current) return;
    inflight.current = true;
    setCompleting(true);
    try {
      let remaining = await flushQueue();
      if (remaining > 0) remaining = await flushQueue();
      if (remaining > 0) {
        toast.error("Todavía hay series pendientes. Revisá tu conexión y reintentá Finalizar.");
        setCompleting(false);
        return;
      }
      load();
      await api.patch(`/client/sessions/${sessionId}`, {
        status: "completed",
        ...(sessionNotes ? { sessionNotes } : {}),
      });
      clearPendingComplete(sessionId);
      router.replace(`/sesion/${sessionId}/completada`);
    } catch (e) {
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
  }, [api, flushQueue, load, router, sessionId, toast]);

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
