"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";
import type { AssistantCard, AssistantChatMessage, AssistantDay, AssistantNote } from "@regen/types";
import { amount, whenLabel } from "../_lib/format";
import { ChatCards } from "./chat-cards";

export function ChatThread({
  day,
  notes,
  messages,
  busy,
  onOpenDay,
  onPick,
  onDoneNote,
}: {
  day: AssistantDay;
  notes: AssistantNote[];
  messages: AssistantChatMessage[];
  busy: boolean;
  onOpenDay: () => void;
  onPick: (text: string) => void;
  onDoneNote: (noteId: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = endRef.current;
    const scroller = node?.closest(".asistente-body");
    if (scroller instanceof HTMLElement) scroller.scrollTop = scroller.scrollHeight;
  }, [messages, busy]);

  return (
    <div className="asistente-chat">
      <button className="asistente-strip" type="button" onClick={onOpenDay}>
        <span>
          <strong>{amount(day.consumed.kcal, 0)} kcal</strong>
          <small>
            {amount(day.consumed.proteinG, 0)} g proteína · {amount(day.liquidsMl, 0)} ml
            {day.remaining.kcal != null ? ` · restan ${amount(day.remaining.kcal, 0)} kcal` : ""}
          </small>
        </span>
        <em>Ver día</em>
      </button>

      {notes.length > 0 && (
        <section className="asistente-card asistente-notes">
          <div className="asistente-card-head">
            <strong>A mano</strong>
          </div>
          {notes.map((note) => (
            <div key={note.id} className="asistente-note">
              <span>
                <strong>{note.text}</strong>
                <small>{note.remindAt ? whenLabel(note.remindAt) : "Sin hora"}</small>
              </span>
              <button
                type="button"
                className="asistente-icon-btn on"
                aria-label={`Listo: ${note.text}`}
                onClick={() => onDoneNote(note.id)}
              >
                <Icon name="check" size={16} />
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="asistente-thread">
        {messages.length === 0 && !busy ? (
          <p className="asistente-empty">
            Contame qué comiste, mandá una foto o un audio, o pedime opciones. Si tomás suplementos, también los marco.
          </p>
        ) : messages.map((message) => (
          <div key={message.id} className={`asistente-turn ${message.role}`}>
            {message.image ? (
              <img className="asistente-thumb" src={message.image} alt="Foto del plato" />
            ) : null}
            {message.inputKind === "voice" && message.role === "user" ? (
              <div className="asistente-voice-chip">
                <Icon name="mic" size={12} />
                Audio
              </div>
            ) : null}
            {showBubble(message) ? (
            <div className={`asistente-bubble ${message.role}`}>
              {bubbleText(message)}
            </div>
            ) : null}
            {message.role === "assistant" && message.cards.length > 0 ? (
              <ChatCards cards={message.cards} busy={busy} onPick={onPick} />
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="asistente-bubble assistant waiting" role="status">
            <span className="asistente-dots" aria-hidden="true"><i /><i /><i /></span>
            <span>Pensando…</span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function showBubble(message: AssistantChatMessage): boolean {
  if (message.role === "assistant") return true;
  if (message.inputKind === "voice") {
    const text = message.text.trim();
    return text !== "" && text !== "Audio";
  }
  if (!message.image) return true;
  const text = message.text.trim();
  return text !== "" && text !== "Foto" && text !== "Foto del plato";
}

function bubbleText(message: AssistantChatMessage): string {
  if (!message.cards.some((card: AssistantCard) => card.kind === "options")) return message.text;
  const marker = "Opciones aproximadas";
  const at = message.text.indexOf(marker);
  if (at === -1) return message.text;
  const end = message.text.indexOf(":", at);
  return (end === -1 ? message.text.slice(0, at + marker.length) : message.text.slice(0, end + 1)).trim();
}
