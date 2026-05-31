"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { StateBlock } from "@/components/ui";
import { ChatMessage, ChatEmptyState } from "./_components/chat-message";
import { ChatInput } from "./_components/chat-input";
import { RefPicker, RefDetail } from "./_components/reference-picker";
import { useChat, useRecentSessions } from "./_hooks/use-chat";
import { RefPayload } from "./_types";
import "./_styles.css";

export default function MensajesAlumnoPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const [isDesktop, setIsDesktop] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [ref, setRef] = useState<RefPayload | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [refDetail, setRefDetail] = useState<RefPayload | null>(null);
  const [refDetailData, setRefDetailData] = useState<unknown>(undefined);
  const stickToBottomRef = useRef(true);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { coachName, messages, loading, sending, load, send } = useChat(api);
  const recentSessions = useRecentSessions(api);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 900px)");
    const apply = () => setIsDesktop(mql.matches);
    const t = window.setTimeout(apply, 0);
    mql.addEventListener("change", apply);
    return () => { window.clearTimeout(t); mql.removeEventListener("change", apply); };
  }, []);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
  }, []);

  const handleSend = useCallback(async () => {
    if (!newMsg.trim() || !user) return;
    stickToBottomRef.current = true;
    try {
      await send(newMsg, { id: user.id, name: user.name }, ref ? { kind: ref.kind, id: ref.id, label: ref.label } : undefined);
      setNewMsg("");
      setRef(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el mensaje");
    }
  }, [newMsg, ref, send, user, toast]);

  useEffect(() => {
    if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!refDetail) return;
    const run = async () => {
      setRefDetailData(undefined);
      const data = refDetail.kind === "session"
        ? await api.get(`/client/sessions/${refDetail.id}`)
        : await api.get(`/client/workouts/${refDetail.id}`);
      setRefDetailData(data);
    };
    run().catch(() => setRefDetailData(null));
  }, [api, refDetail]);

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-title">Mensajes</div>
        <div className="chat-subtitle">Chat con {coachName}</div>
      </div>

      {loading ? (
        <div style={{ padding: 20 }}><StateBlock kind="loading" title="Cargando chat…" /></div>
      ) : (
        <>
          <div
            ref={listRef}
            onScroll={() => { stickToBottomRef.current = isNearBottom(); }}
            className="chat-content"
          >
            {messages.length === 0 ? <ChatEmptyState /> : messages.map(m => (
              <ChatMessage key={m.id} message={m} currentUserId={user?.id} onRefClick={setRefDetail} />
            ))}
            <div ref={bottomRef} />
          </div>

          <ChatInput
            value={newMsg}
            onChange={setNewMsg}
            onSend={handleSend}
            sending={sending}
            reference={ref}
            onClearRef={() => setRef(null)}
            onOpenRefPicker={() => setRefPickerOpen(true)}
          />
        </>
      )}

      {refPickerOpen && (
        <RefPicker
          sessions={recentSessions}
          onClose={() => setRefPickerOpen(false)}
          onSelect={r => { setRef(r); setRefPickerOpen(false); }}
        />
      )}

      {refDetail && (
        <RefDetail
          reference={refDetail}
          data={refDetailData}
          loading={refDetailData === undefined}
          isDesktop={isDesktop}
          onClose={() => setRefDetail(null)}
        />
      )}
    </div>
  );
}
