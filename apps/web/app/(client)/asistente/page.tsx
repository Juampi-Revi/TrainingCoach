"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, StateBlock, Tabs } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { useAssistant } from "./_hooks/use-assistant";
import { ChatThread } from "./_components/chat-thread";
import { Composer, type AssistantPhoto } from "./_components/composer";
import type { AssistantAudio } from "./_hooks/use-voice-recorder";
import { TodayView } from "./_components/today-view";
import { HistoryView } from "./_components/history-view";
import "./_styles.css";

const TABS = ["Chat", "Hoy", "Historial"] as const;

export default function AsistentePage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { day, notes, messages, loading, sending, error, send, setDay, completeNote } = useAssistant();
  const [tab, setTab] = useState<string>("Chat");

  if (!user?.assistantBeta) {
    return (
      <div className="asistente-page">
        <StateBlock kind="empty" title="No disponible" body="Esta sección no está habilitada en tu cuenta." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="asistente-page">
        <StateBlock kind="loading" title="Cargando asistente…" />
      </div>
    );
  }

  if (error && !day) {
    return (
      <div className="asistente-page">
        <StateBlock
          kind="error"
          title="No se pudo abrir"
          body={error}
          cta={<Button size="sm" onClick={() => router.refresh()}>Reintentar</Button>}
        />
      </div>
    );
  }

  async function handleSend(text: string, photo?: AssistantPhoto, audio?: AssistantAudio) {
    try {
      await send(text, photo, audio);
    } catch {
      toast.error("No se pudo enviar");
    }
  }

  async function handleDoneNote(noteId: string) {
    try {
      await completeNote(noteId);
    } catch {
      toast.error("No se pudo marcar el apunte");
    }
  }

  return (
    <div className="asistente-page">
      <header className="asistente-header">
        <div>
          <div className="asistente-title">Nutrición</div>
          <div className="asistente-sub">Comidas, bebidas y el chat del día</div>
        </div>
        <button
          type="button"
          className="asistente-config"
          aria-label="Configurar metas"
          onClick={() => router.push("/cuenta/metas")}
        >
          <Icon name="settings" size={20} />
        </button>
      </header>

      <div className="asistente-tabs">
        <Tabs variant="pills" tabs={[...TABS]} active={tab} onChange={setTab} />
      </div>

      <div className="asistente-body">
        {tab === "Chat" && day && (
          <ChatThread
            day={day}
            notes={notes}
            messages={messages}
            busy={sending}
            onOpenDay={() => setTab("Hoy")}
            onPick={handleSend}
            onDoneNote={handleDoneNote}
          />
        )}
        {tab === "Hoy" && day && <TodayView day={day} onDay={setDay} />}
        {tab === "Historial" && day && <HistoryView today={day.localDate} />}
      </div>

      {tab === "Chat" && <Composer busy={sending} onSend={handleSend} />}
    </div>
  );
}
