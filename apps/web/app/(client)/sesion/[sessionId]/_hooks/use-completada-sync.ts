"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { SessionDetail } from "@regen/types";
import { clearPendingComplete, isClosedSessionStatus, readPendingComplete } from "../_lib/session-complete";

export function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function useCompletadaSync(sessionId: string) {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineClosed, setOfflineClosed] = useState(false);
  const [energy, setEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [performedAtInput, setPerformedAtInput] = useState("");
  const [completedAtInput, setCompletedAtInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pending = readPendingComplete(sessionId);
      if (pending) {
        setOfflineClosed(true);
        if (!cancelled) setLoading(false);
        try {
          await api.patch(`/client/sessions/${sessionId}`, {
            status: "completed",
            ...(pending.sessionNotes ? { sessionNotes: pending.sessionNotes } : {}),
          }, { timeoutMs: 8_000, delaysMs: [] });
        } catch { /* retry when back online */ }
      }
      try {
        const s = await api.get<SessionDetail>(`/client/sessions/${sessionId}`);
        if (cancelled) return;
        if (isClosedSessionStatus(s.status)) {
          clearPendingComplete(sessionId);
          setOfflineClosed(false);
          setSession(s);
          setEnergy(s.energyRating != null ? Math.ceil(s.energyRating / 2) : null);
          setNotes(s.sessionNotes ?? "");
          setPerformedAtInput(toLocalInputValue(new Date(s.performedAt)));
          setCompletedAtInput(s.completedAt ? toLocalInputValue(new Date(s.completedAt)) : "");
          return;
        }
        if (pending || readPendingComplete(sessionId)) {
          setOfflineClosed(true);
          return;
        }
        router.replace(`/sesion/${sessionId}`);
      } catch {
        if (pending || readPendingComplete(sessionId)) {
          setOfflineClosed(true);
          return;
        }
        toast.error("No se pudo cargar la sesión");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const onOnline = () => { void load(); };
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [api, router, sessionId, toast]);

  return {
    session,
    loading,
    offlineClosed,
    energy,
    setEnergy,
    notes,
    setNotes,
    performedAtInput,
    setPerformedAtInput,
    completedAtInput,
    setCompletedAtInput,
  };
}
