"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon, StateBlock } from "@/components/ui";

interface MessageItem {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string };
  session: { id: string; workoutTitle: string; performedAt: string };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

function readKey(sessionId: string) {
  return `regen_msg_read_${sessionId}`;
}

export default function MensajesAlumnoPage() {
  const { api } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<MessageItem[]>("/client/messages")
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const sessions = useMemo(() => {
    const bySession = messages.reduce<Record<string, MessageItem[]>>((acc, m) => {
      const key = m.session.id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});

    const items = Object.entries(bySession).map(([sessionId, msgs]) => {
      const lastMsg = msgs[0]!;
      const lastRead = (() => {
        try {
          const v = window.localStorage.getItem(readKey(sessionId));
          return v ? new Date(v).getTime() : 0;
        } catch {
          return 0;
        }
      })();
      const unread = msgs.filter((m) => m.author.role === "coach" && new Date(m.createdAt).getTime() > lastRead).length;
      return { sessionId, session: lastMsg.session, lastMsg, unread };
    });

    items.sort((a, b) => new Date(b.lastMsg.createdAt).getTime() - new Date(a.lastMsg.createdAt).getTime());
    return items;
  }, [messages]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Mensajes</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
          {sessions.length} conversación{sessions.length !== 1 ? "es" : ""}
        </div>
      </div>

      <div style={{ padding: "0 20px 16px" }}>
        {loading ? (
          <StateBlock kind="loading" title="Cargando mensajes…" />
        ) : sessions.length === 0 ? (
          <StateBlock
            kind="empty"
            title="Sin mensajes"
            body="Cuando vos o tu coach comenten en una sesión, aparece acá."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map(({ sessionId, session, lastMsg, unread }) => {
              const isFromCoach = lastMsg.author.role === "coach";
              return (
                <button
                  key={sessionId}
                  onClick={() => router.push(`/comentarios/${sessionId}`)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    background: unread > 0 ? "var(--bg-1)" : "transparent",
                    padding: "12px 14px",
                    cursor: "pointer",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "var(--bg-2)",
                      border: "1px solid var(--line-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="msg" size={18} color={unread > 0 ? "var(--lime)" : "var(--text-mute)"} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                      <div className="ta-ellipsis" style={{ fontSize: 14, fontWeight: unread > 0 ? 700 : 600 }}>
                        {session.workoutTitle}
                      </div>
                      <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", flexShrink: 0 }}>
                        {timeAgo(lastMsg.createdAt)}
                      </div>
                    </div>

                    <div className="ta-ellipsis" style={{ fontSize: 13, color: isFromCoach ? "var(--text)" : "var(--text-mute)", marginTop: 2 }}>
                      {isFromCoach ? "Coach: " : "Vos: "}{lastMsg.text}
                    </div>
                  </div>

                  {unread > 0 && (
                    <div
                      style={{
                        minWidth: 22,
                        height: 22,
                        borderRadius: 999,
                        background: "var(--lime)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 6px",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#0B0B0C" }}>{unread}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

