"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readPendingComplete, savePendingComplete } from "../_lib/session-complete";

export function useCompleteSession({
  sessionId,
}: {
  sessionId: string;
  flushQueue: () => Promise<number>;
}) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [leftLogger, setLeftLogger] = useState(false);
  const inflight = useRef(false);

  const goToCompletada = useCallback(() => {
    router.replace(`/sesion/${sessionId}/completada`);
  }, [router, sessionId]);

  const completeSession = useCallback(async (sessionNotes?: string) => {
    if (inflight.current) return;
    inflight.current = true;
    setCompleting(true);
    savePendingComplete(sessionId, typeof sessionNotes === "string" ? sessionNotes : undefined);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      goToCompletada();
      return;
    }
    setLeftLogger(true);
  }, [goToCompletada, sessionId]);

  useEffect(() => {
    const onOnline = () => {
      if (!readPendingComplete(sessionId)) return;
      goToCompletada();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [goToCompletada, sessionId]);

  return { completing, completeSession, leftLogger };
}
