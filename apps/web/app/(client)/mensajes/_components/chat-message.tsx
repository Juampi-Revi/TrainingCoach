"use client";

import { Avatar, Icon } from "@/components/ui";
import { ChatMessageItem, RefPayload } from "../_types";

interface ChatMessageProps {
  message: ChatMessageItem;
  currentUserId?: string;
  onRefClick: (ref: RefPayload) => void;
}

export function ChatMessage({ message, currentUserId, onRefClick }: ChatMessageProps) {
  const isMe = message.author.id === currentUserId;
  const authorName = isMe ? "Vos" : (message.author.name ?? message.author.role);

  return (
    <div className={`msg-row ${isMe ? "me" : "them"}`}>
      <Avatar name={authorName} size={28} tone={isMe ? "var(--lime)" : "#7AB8FF"} />
      <div className="msg-bubble">
        <div className="msg-meta">
          <span className="msg-author">{authorName}</span>
          <span className="msg-sep">·</span>
          <span className="msg-time ta-mono">
            {new Date(message.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        {message.reference && (
          <button className="msg-ref-btn" onClick={() => onRefClick(message.reference as RefPayload)}>
            <Icon name="book" size={14} color="var(--text-mute)" />
            <div className="ta-ellipsis">
              {message.reference.kind === "session" ? "Sesión" : "Entrenamiento"}
              {message.reference.label ? ` · ${message.reference.label}` : ""}
            </div>
          </button>
        )}
        <div className={`msg-text ${isMe ? "sent" : "received"}`}>{message.text}</div>
      </div>
    </div>
  );
}

export function ChatEmptyState() {
  return (
    <div className="chat-empty">Aún no hay mensajes. Escribile a tu coach.</div>
  );
}