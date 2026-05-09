import { useState, useEffect, useCallback } from "react";
import { ChatMessageItem, ChatData, SessionOption } from "../_types";

export function useChat(api: { get: <T>(url: string) => Promise<T>; post: (url: string, body?: Record<string, unknown>) => Promise<unknown> }) {
  const [coachName, setCoachName] = useState("Coach");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<ChatData>("/client/chat?take=160");
    setCoachName(res.coach.name ?? "Coach");
    setMessages(res.messages);
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    const runLoad = () => {
      load().catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    };
    const t = window.setTimeout(runLoad, 0);

    const handleVis = () => { if (document.visibilityState === "visible") runLoad(); };
    document.addEventListener("visibilitychange", handleVis);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") runLoad();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", handleVis);
      window.clearInterval(interval);
    };
  }, [load]);

  const send = useCallback(async (text: string, reference?: { kind: string; id: string; label?: string }) => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post("/client/chat", { text: text.trim(), reference });
    } finally {
      setSending(false);
    }
  }, [api]);

  return { coachName, messages, loading, sending, load, send };
}

export function useRecentSessions(api: { get: <T>(url: string) => Promise<T> }) {
  const [sessions, setSessions] = useState<SessionOption[]>([]);

  useEffect(() => {
    api.get<{ items: SessionOption[] }>("/client/sessions?limit=10")
      .then(r => setSessions(r.items))
      .catch(() => {});
  }, [api]);

  return sessions;
}