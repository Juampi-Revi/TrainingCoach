"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

interface MessageItem {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string };
  session: {
    id: string;
    clientUserId: string;
    clientName: string;
    workoutTitle: string;
    performedAt: string;
  };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

const TONES = ["#FF5B5B", "#FFB547", "#7AB8FF", "var(--lime)", "#6EE7A8"];

export default function MensajesPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<MessageItem[]>("/coach/messages")
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  // Group by session
  const bySession = messages.reduce<Record<string, MessageItem[]>>((acc, m) => {
    const key = m.session.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const sessions = Object.entries(bySession).map(([sessionId, msgs]) => ({
    sessionId,
    session: msgs[0].session,
    lastMsg: msgs[0],
    unread: msgs.filter((m) => m.author.role === "client").length,
  }));

  return (
    <DesktopShell
      active="messages"
      title="Mensajes"
      subtitle={`${sessions.length} conversaciones`}
      coachName={user?.name ?? "Coach"}
    >
      <div style={{ padding: 28 }}>
        {loading ? (
          <StateBlock kind="loading" title="Cargando mensajes…" />
        ) : sessions.length === 0 ? (
          <StateBlock
            kind="empty"
            title="Sin mensajes"
            body="Cuando tus alumnos o vos comenten en una sesión, aparecerán acá."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sessions.map(({ sessionId, session, lastMsg, unread }, i) => {
              const isFromClient = lastMsg.author.role === "client";
              return (
                <div
                  key={sessionId}
                  onClick={() =>
                    router.push(`/coach/alumnos/${session.clientUserId}/sesiones/${sessionId}`)
                  }
                  className="ta-row"
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    alignItems: "center",
                    cursor: "pointer",
                    background: unread > 0 ? "var(--bg-1)" : "transparent",
                    border: "1px solid",
                    borderColor: unread > 0 ? "var(--line)" : "transparent",
                    marginBottom: 4,
                  }}
                >
                  <Avatar
                    name={session.clientName}
                    size={44}
                    tone={TONES[i % TONES.length]}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: unread > 0 ? 700 : 600 }}>
                        {session.clientName}
                      </span>
                      <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", flexShrink: 0 }}>
                        {timeAgo(lastMsg.createdAt)}
                      </span>
                    </div>
                    <div
                      className="ta-ellipsis"
                      style={{
                        fontSize: 12,
                        color: "var(--lime)",
                        fontWeight: 500,
                        marginBottom: 2,
                      }}
                    >
                      {session.workoutTitle}
                    </div>
                    <div
                      className="ta-ellipsis"
                      style={{
                        fontSize: 13,
                        color: isFromClient ? "var(--text)" : "var(--text-mute)",
                        fontWeight: isFromClient ? 500 : 400,
                      }}
                    >
                      {isFromClient ? "" : "Vos: "}{lastMsg.text}
                    </div>
                  </div>
                  {unread > 0 && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "var(--lime)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#0B0B0C" }}>{unread}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
