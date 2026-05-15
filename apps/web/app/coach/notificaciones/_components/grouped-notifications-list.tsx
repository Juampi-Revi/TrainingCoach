"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Icon } from "@/components/ui";
import type { AppNotification } from "@/lib/use-notifications";
import type { CoachClientSummary } from "@regen/types";

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  new_message: { icon: "msg", color: "var(--accent-text)" },
  client_inactive: { icon: "history", color: "#FFB547" },
  session_completed: { icon: "check", color: "var(--success)" },
  food_logged: { icon: "plate", color: "#FFB547" },
  coach_weekly_summary: { icon: "calendar", color: "#7AB8FF" },
};

type Enriched = AppNotification & { _clientId: string | null; _clientName: string | null };

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

function groupKey(n: Enriched) {
  return n._clientId ?? "other";
}

export function GroupedNotificationsList(props: {
  items: Enriched[];
  clientMap: Map<string, CoachClientSummary>;
  onMarkRead?: (id: string) => void;
}) {
  const { items, clientMap, onMarkRead } = props;
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, Enriched[]>();
    for (const n of items) {
      const k = groupKey(n);
      map.set(k, [...(map.get(k) ?? []), n]);
    }

    const list = [...map.entries()].map(([key, groupItems]) => {
      groupItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const unread = groupItems.filter((x) => !x.readAt).length;
      const latest = groupItems[0]?.createdAt ?? new Date(0).toISOString();
      return { key, items: groupItems, unread, latest };
    });

    list.sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return new Date(b.latest).getTime() - new Date(a.latest).getTime();
    });

    return list;
  }, [items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {groups.map((g) => {
        const client = g.key !== "other" ? clientMap.get(g.key) ?? null : null;
        const clientName = client ? (client.name ?? client.email) : "Sin alumno";
        const planId = client?.assignment?.plan?.id ?? null;
        const planTitle = client?.assignment?.plan?.title ?? null;
        const isCollapsed = collapsed[g.key] ?? false;

        return (
          <div
            key={g.key}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 14,
              background: "var(--bg-1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 12px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [g.key]: !isCollapsed }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 0,
                  flex: 1,
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {client ? (
                  <Avatar name={clientName} size={36} />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      border: "1px solid var(--line-2)",
                      background: "var(--bg-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="bell" size={16} color="var(--text-dim)" />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-.01em", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {clientName}
                    </div>
                    {g.unread > 0 && (
                      <div style={{ minWidth: 18, height: 18, padding: "0 6px", borderRadius: 999, background: "rgba(215,255,58,.22)", border: "1px solid rgba(215,255,58,.35)", color: "var(--text)", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center" }}>
                        {g.unread}
                      </div>
                    )}
                  </div>
                  {planTitle && (
                    <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {planTitle}
                    </div>
                  )}
                </div>
              </button>

              {client && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="msg"
                    title="Mensaje"
                    ariaLabel="Mensaje"
                    onClick={() => router.push(`/coach/mensajes/${client.id}`)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon="calendar"
                    title="Agenda"
                    ariaLabel="Agenda"
                    onClick={() => router.push(`/coach/calendario?view=week&clientId=${client.id}`)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon="book"
                    title="Plan"
                    ariaLabel="Plan"
                    disabled={!planId}
                    onClick={() => {
                      if (planId) router.push(`/coach/planes/${planId}`);
                    }}
                  />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {g.items.map((n) => {
                  const meta = TYPE_ICON[n.type] ?? { icon: "bell", color: "var(--text-mute)" };
                  const isUnread = !n.readAt;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (isUnread) onMarkRead?.(n.id);
                        if (n.linkUrl) router.push(n.linkUrl);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 12px",
                        background: isUnread ? "rgba(255,255,255,.02)" : "transparent",
                        border: "none",
                        borderTop: "1px solid var(--line)",
                        cursor: n.linkUrl ? "pointer" : "default",
                      }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "var(--bg-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon as Parameters<typeof Icon>[0]["name"]} size={16} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: isUnread ? 900 : 600, color: "var(--text)", lineHeight: 1.3 }}>{n.title}</div>
                        {n.body && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>}
                        <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                      </div>
                      {isUnread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lime)", flexShrink: 0, marginTop: 4 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
