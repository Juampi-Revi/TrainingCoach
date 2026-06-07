import { useRef, useState, useEffect, useCallback } from "react";
import { ChatMessageItem, ChatData, SessionOption, RefPayload, UploadedChatMedia } from "../_types";

export function useChat(api: { get: <T>(url: string) => Promise<T>; post: <T>(url: string, body?: Record<string, unknown>) => Promise<T> }) {
  const [coachName, setCoachName] = useState("Coach");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const loadInFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    try {
      const res = await api.get<ChatData>("/client/chat?take=160");
      setCoachName(res.coach.name ?? "Coach");
      setMessages(res.messages);
    } catch {
      // silent for background polling
    } finally {
      loadInFlightRef.current = false;
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    const runLoad = () => {
      load().finally(() => { if (!cancelled) setLoading(false); });
    };
    const t = window.setTimeout(runLoad, 0);

    const handleVis = () => { if (document.visibilityState === "visible") runLoad(); };
    document.addEventListener("visibilitychange", handleVis);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") runLoad();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", handleVis);
      window.clearInterval(interval);
    };
  }, [load]);

  const send = useCallback(async (args: { text: string; user: { id: string; name: string | null }; reference?: RefPayload; media?: UploadedChatMedia | null }) => {
    const text = args.text.trim();
    const hasMedia = !!args.media;
    if (!text && !hasMedia) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessageItem = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
      author: { id: args.user.id, name: args.user.name, role: "client" },
      reference: args.reference ?? null,
      media: args.media
        ? {
            type: args.media.kind,
            url: args.media.url,
            width: args.media.width,
            height: args.media.height,
            bytes: args.media.bytes,
            durationSeconds: args.media.durationSeconds,
          }
        : null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      const saved = await api.post<ChatMessageItem>("/client/chat", {
        text,
        reference: args.reference,
        media: args.media
          ? {
              type: args.media.kind,
              url: args.media.url,
              publicId: args.media.publicId,
              width: args.media.width,
              height: args.media.height,
              bytes: args.media.bytes,
              durationSeconds: args.media.durationSeconds,
            }
          : undefined,
      });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw new Error("No se pudo enviar el mensaje");
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
