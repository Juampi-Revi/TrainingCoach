"use client";

import { Avatar, Icon } from "@/components/ui";
import type { ChatMessageItem, RefPayload } from "./chat-types";

export function CoachChatMessage({
  message,
  currentUserId,
  clientName,
  onRefClick,
}: {
  message: ChatMessageItem;
  currentUserId: string | undefined;
  clientName: string;
  onRefClick: (ref: RefPayload) => void;
}) {
  const isMe = message.author.id === currentUserId;
  const authorName = isMe ? "Vos" : (message.author.name ?? message.author.role);
  const refLabel =
    message.reference?.kind === "session"
      ? `Alumnos / ${clientName} / ${message.reference.label ?? "Sesión"}`
      : message.reference?.kind === "workoutTemplate"
        ? `Entrenamientos / ${message.reference.label ?? "Entrenamiento"}`
        : null;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row" }}>
      <Avatar name={authorName} size={28} tone={isMe ? "var(--lime)" : "var(--info)"} />
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 10, color: "var(--text-mute)", marginBottom: 3, display: "flex", gap: 6, justifyContent: isMe ? "flex-end" : "flex-start" }}>
          <span style={{ fontWeight: 600 }}>{authorName}</span>
          <span>·</span>
          <span className="ta-mono">
            {new Date(message.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {message.reference && (
          <button
            onClick={() => onRefClick(message.reference as RefPayload)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              marginBottom: 6,
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="book" size={14} color="var(--text-mute)" />
              <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
                {refLabel ?? "Referencia"}
              </div>
            </div>
          </button>
        )}

        {!!message.text?.trim() && (
          <div
            style={{
              padding: "10px 12px",
              background: isMe ? "var(--lime)" : "var(--bg-1)",
              color: isMe ? "var(--bg)" : "var(--text)",
              border: isMe ? "none" : "1px solid var(--line)",
              borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              fontSize: 14,
              lineHeight: 1.45,
              fontWeight: 500,
              whiteSpace: "pre-wrap",
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
