"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { ApiError } from "@/lib/api";
import { clearPendingComplete, savePendingComplete } from "../_lib/session-complete";

export function useCompleteSession({
  sessionId,
}: {
  sessionId: string;
  flushQueue: () => Promise<number>;
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
      await api.patch(`/client/sessions/${sessionId}`, {
        status: "completed",
        ...(sessionNotes ? { sessionNotes } : {}),
      }, { timeoutMs: 15_000, delaysMs: [] });
      clearPendingComplete(sessionId);
      router.replace(`/sesion/${sessionId}/completada`);
    } catch (e) {
      savePendingComplete(sessionId, sessionNotes);
      const message = e instanceof ApiError && e.status === 0
        ? "No se pudo cerrar. Tocá Finalizar otra vez."
        : e instanceof Error ? e.message : "No se pudo cerrar la sesión";
      toast.error(message);
      setCompleting(false);
    } finally {
      inflight.current = false;
    }
  }, [api, router, sessionId, toast]);

  return { completing, completeSession };
}
