"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

type ThreadItem = {
  threadId: string | null;
  client: { id: string; name: string };
  lastMessage: null | {
    id: string;
    text: string;
    createdAt: string;
    author: { id: string; name: string | null; role: string };
    reference: null | { kind: string; id: string; label: string | null };
  };
};

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
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(() => {
    api
      .get<ThreadItem[]>("/coach/chat")
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    fetchThreads();

    const onVis = () => {
      if (document.visibilityState === "visible") fetchThreads();
    };
    document.addEventListener("visibilitychange", onVis);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchThreads();
    }, 8000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
    };
  }, [fetchThreads]);

  const items = useMemo(() => {
    return threads.map((t) => {
      const lastRead = (() => {
        try {
          const v = window.localStorage.getItem(`regen_chat_read_${t.client.id}`);
          return v ? new Date(v).getTime() : 0;
        } catch {
          return 0;
        }
      })();
      const unread = t.lastMessage?.author.role === "client" && new Date(t.lastMessage.createdAt).getTime() > lastRead;
      return { ...t, unread };
    });
  }, [threads]);

  return (
    <DesktopShell
      active="messages"
      title="Mensajes"
      subtitle={`${items.length} conversaciones`}
      coachName={user?.name ?? "Coach"}
    >
      <div style={{ padding: 28 }}>
        {loading ? (
          <StateBlock kind="loading" title="Cargando mensajes…" />
        ) : items.length === 0 ? (
          <StateBlock
            kind="empty"
            title="Sin mensajes"
            body="Cuando tus alumnos o vos comenten en una sesión, aparecerán acá."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {items.map((t, i) => {
              const lastMsg = t.lastMessage;
              const isFromClient = lastMsg?.author.role === "client";
              return (
                <div
                  key={t.client.id}
                  onClick={() =>
                    router.push(`/coach/mensajes/${t.client.id}`)
                  }
                  className="ta-row"
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    alignItems: "center",
                    cursor: "pointer",
                    background: t.unread ? "var(--bg-1)" : "transparent",
                    border: "1px solid",
                    borderColor: t.unread ? "var(--line)" : "transparent",
                    marginBottom: 4,
                  }}
                >
                  <Avatar
                    name={t.client.name}
                    size={44}
                    tone={TONES[i % TONES.length]}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: t.unread ? 700 : 600 }}>
                        {t.client.name}
                      </span>
                      <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", flexShrink: 0 }}>
                        {lastMsg ? timeAgo(lastMsg.createdAt) : ""}
                      </span>
                    </div>
                    <div
                      className="ta-ellipsis"
                      style={{
                        fontSize: 13,
                        color: isFromClient ? "var(--text)" : "var(--text-mute)",
                        fontWeight: isFromClient ? 500 : 400,
                      }}
                    >
                      {lastMsg ? `${isFromClient ? "" : "Vos: "}${lastMsg.text}` : "Sin mensajes todavía"}
                    </div>
                  </div>
                  {t.unread && (
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
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#0B0B0C" }}>•</span>
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
