"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useNotifications } from "@/lib/use-notifications";

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  new_message:       { icon: "msg",      color: "var(--lime)"  },
  plan_assigned:     { icon: "calendar", color: "#7AB8FF"      },
  client_added:      { icon: "users",    color: "#FFB547"      },
  session_completed: { icon: "check",    color: "var(--success)"},
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "Ahora";
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

export default function NotificacionesPage() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAllRead } = useNotifications();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Notificaciones</div>
          {unreadCount > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>{unreadCount} sin leer</div>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--lime)", fontWeight: 600, padding: "4px 0" }}
          >
            Marcar todas
          </button>
        )}
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
            <Icon name="bell" size={32} color="var(--bg-3)" />
            <div style={{ marginTop: 12 }}>Sin notificaciones</div>
          </div>
        ) : notifications.map((n) => {
          const meta = TYPE_ICON[n.type] ?? { icon: "bell", color: "var(--text-mute)" };
          const isUnread = !n.readAt;
          return (
            <button
              key={n.id}
              onClick={() => { if (n.linkUrl) router.push(n.linkUrl); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left",
                padding: "12px 14px", borderRadius: 12,
                background: isUnread ? "var(--bg-1)" : "transparent",
                border: `1px solid ${isUnread ? "var(--line)" : "transparent"}`,
                cursor: n.linkUrl ? "pointer" : "default",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "var(--bg-2)", border: "1px solid var(--line-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={meta.icon as Parameters<typeof Icon>[0]["name"]} size={16} color={meta.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: isUnread ? 700 : 500, color: "var(--text)", lineHeight: 1.3 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                )}
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
                  {timeAgo(n.createdAt)}
                </div>
              </div>
              {isUnread && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lime)", flexShrink: 0, marginTop: 4 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
