"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { CoachChatMessage } from "./_components/coach-chat-message";
import { CoachChatComposer } from "./_components/coach-chat-composer";
import { RefPickerModal } from "./_components/ref-picker-modal";
import { RefDetailDrawer } from "./_components/ref-detail-drawer";
import type { ChatMessageItem, ChatResponse, ClientDetailResponse, RefPayload } from "./_components/chat-types";

export default function CoachChatPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { clientUserId } = useParams<{ clientUserId: string }>();

  const [clientName, setClientName] = useState("Alumno");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [ref, setRef] = useState<RefPayload | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ClientDetailResponse["recentSessions"]>([]);
  const [refDetail, setRefDetail] = useState<RefPayload | null>(null);
  const [refDetailData, setRefDetailData] = useState<unknown | null | undefined>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const loadInFlightRef = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 900px)");
    const apply = () => setIsDesktop(mql.matches);
    const t = window.setTimeout(apply, 0);
    mql.addEventListener("change", apply);
    return () => {
      window.clearTimeout(t);
      mql.removeEventListener("change", apply);
    };
  }, []);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
  }, []);

  const load = useCallback(() => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    api
      .get<ChatResponse>(`/coach/chat/${clientUserId}?take=200`)
      .then((r) => {
        setClientName(r.client.name ?? "Alumno");
        setMessages(r.messages);
      })
      .catch(() => {
        if (loading) toast.error("No se pudo cargar el chat");
      })
      .finally(() => {
        loadInFlightRef.current = false;
        setLoading(false);
      });
  }, [api, clientUserId, loading, toast]);

  useEffect(() => {
    load();

    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 2000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`regen_chat_read_${clientUserId}`, new Date().toISOString());
    } catch {}
  }, [clientUserId, messages.length]);

  function openRefDetail(next: RefPayload) {
    setRefDetailData(undefined);
    setRefDetail(next);
  }

  useEffect(() => {
    if (!refDetail) return;
    if (refDetail.kind === "session") {
      api
        .get(`/coach/clients/${clientUserId}/sessions/${refDetail.id}`)
        .then(setRefDetailData)
        .catch(() => setRefDetailData(null));
      return;
    }
    api
      .get(`/coach/workouts/${refDetail.id}`)
      .then(setRefDetailData)
      .catch(() => setRefDetailData(null));
  }, [api, clientUserId, refDetail]);

  useEffect(() => {
    if (!refPickerOpen) return;
    if (recentSessions.length > 0) return;
    api
      .get<ClientDetailResponse>(`/coach/clients/${clientUserId}`)
      .then((r) => setRecentSessions(r.recentSessions ?? []))
      .catch(() => {});
  }, [api, clientUserId, recentSessions.length, refPickerOpen]);

  const send = useCallback(async () => {
    if (!newMsg.trim()) return;
    const text = newMsg.trim();
    const reference = ref ? { kind: ref.kind, id: ref.id, label: ref.label } as RefPayload : null;
    const tempId = `temp-${Date.now()}`;

    const optimistic: ChatMessageItem = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
      author: { id: user!.id, name: user!.name, role: "coach" },
      reference,
    };

    setNewMsg("");
    setRef(null);
    setSending(true);
    stickToBottomRef.current = true;
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await api.post<ChatMessageItem>(`/coach/chat/${clientUserId}`, {
        text,
        reference: reference ? { kind: reference.kind, id: reference.id, label: reference.label } : undefined,
      });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  }, [api, clientUserId, newMsg, ref, toast, user]);

  const coachName = user?.name ?? "Coach";

  return (
    <DesktopShell
      active="messages"
      title="Mensajes"
      subtitle={`Chat con ${clientName}`}
      coachName={coachName}
      actions={
        <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/mensajes")}>
          Volver
        </Button>
      }
    >
      {loading ? (
        <div style={{ padding: 28 }}>
          <StateBlock kind="loading" title="Cargando chat…" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 70px)" }}>
          <div
            ref={listRef}
            onScroll={() => {
              stickToBottomRef.current = isNearBottom();
            }}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-mute)", marginTop: 16 }}>
                Aún no hay mensajes. Escribile a tu alumno.
              </div>
            )}

            {messages.map((m) => (
              <CoachChatMessage
                key={m.id}
                message={m}
                currentUserId={user?.id}
                clientName={clientName}
                onRefClick={openRefDetail}
              />
            ))}

            <div ref={bottomRef} />
          </div>

          <CoachChatComposer
            value={newMsg}
            onChange={setNewMsg}
            onSend={send}
            sending={sending}
            reference={ref}
            onClearRef={() => setRef(null)}
            onOpenRefPicker={() => setRefPickerOpen(true)}
            clientName={clientName}
          />
        </div>
      )}

      <RefPickerModal
        open={refPickerOpen}
        sessions={recentSessions}
        onClose={() => setRefPickerOpen(false)}
        onSelect={(next) => {
          setRef(next);
          setRefPickerOpen(false);
        }}
      />

      <RefDetailDrawer
        reference={refDetail}
        data={refDetailData}
        loading={refDetailData === undefined}
        isDesktop={isDesktop}
        clientName={clientName}
        onClose={() => setRefDetail(null)}
      />
    </DesktopShell>
  );
}
