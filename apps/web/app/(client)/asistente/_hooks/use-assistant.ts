import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { AssistantChatMessage, AssistantDay, AssistantNote, AssistantPostResponse } from "@regen/types";
import type { AssistantPhoto } from "../_components/composer";
import type { AssistantAudio } from "./use-voice-recorder";

function userMessage(
  id: string,
  text: string,
  kind: string,
  image: string | null,
): AssistantChatMessage {
  return { id, role: "user", text, inputKind: kind, createdAt: new Date().toISOString(), cards: [], image };
}

export function useAssistant() {
  const { api } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [day, setDay] = useState<AssistantDay | null>(null);
  const [notes, setNotes] = useState<AssistantNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boot = useCallback(async () => {
    try {
      const opened = await api.post<{ id: string; notes: AssistantNote[] }>("/client/assistant/conversations", {});
      setConversationId(opened.id);
      setNotes(opened.notes ?? []);
      const [thread, snapshot] = await Promise.all([
        api.get<{ messages: AssistantChatMessage[] }>(`/client/assistant/conversations/${opened.id}/messages`),
        api.get<AssistantDay>("/client/assistant/day"),
      ]);
      setMessages(thread.messages);
      setDay(snapshot);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el asistente");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void boot(); }, [boot]);

  const send = useCallback(async (text: string, photo?: AssistantPhoto, audio?: AssistantAudio) => {
    if (!conversationId || sending) return;
    const sent = text.trim() || (photo ? "Foto del plato" : audio ? "Audio" : "");
    if (!sent) return;
    const kind = photo ? "photo" : audio ? "voice" : "text";
    const image = photo ? `data:${photo.mediaType};base64,${photo.data}` : null;
    const pendingId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMessage(pendingId, sent, kind, image)]);
    setSending(true);
    try {
      const reply = await api.post<AssistantPostResponse>(
        `/client/assistant/conversations/${conversationId}/messages`,
        { text: text.trim(), inputKind: kind, clientMessageId: crypto.randomUUID(), image: photo, audio },
        { timeoutMs: 60_000, delaysMs: [] },
      );
      const userText = reply.userText?.trim() || sent;
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== pendingId),
        userMessage(pendingId, userText, kind, image),
        { id: `${pendingId}-reply`, role: "assistant", text: reply.text, inputKind: "text", createdAt: new Date().toISOString(), cards: reply.cards },
      ]);
      setDay(reply.day);
      setNotes(reply.notes);
      setError(null);
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((message) => message.id !== pendingId));
      setError(e instanceof Error ? e.message : "No se pudo enviar");
      throw e;
    } finally {
      setSending(false);
    }
  }, [api, conversationId, sending]);

  const completeNote = useCallback(async (noteId: string) => {
    const result = await api.patch<{ notes: AssistantNote[] }>(`/client/assistant/notes/${noteId}`, { done: true });
    setNotes(result.notes);
  }, [api]);

  const refreshDay = useCallback(async () => {
    const snapshot = await api.get<AssistantDay>("/client/assistant/day");
    setDay(snapshot);
  }, [api]);

  return { day, notes, messages, loading, sending, error, send, setDay, completeNote, refreshDay, refetch: boot };
}
