"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { Icon, Button, Input } from "@/components/ui";
import { useNotifications } from "@/lib/use-notifications";
import type { CoachClientSummary } from "@regen/types";
import { GroupedNotificationsList } from "../../coach/notificaciones/_components/grouped-notifications-list";

type TypeFilter = "all" | "messages" | "sessions" | "clients" | "other";

function notificationTypeGroup(type: string): TypeFilter {
  if (type === "new_message") return "messages";
  if (type === "session_completed") return "sessions";
  if (type === "client_added" || type === "client_inactive") return "clients";
  return "other";
}

function extractClientIdFromLinkUrl(url: string | null): string | null {
  if (!url) return null;
  const m1 = url.match(/^\/coach\/alumnos\/([^/]+)/);
  if (m1?.[1]) return m1[1];
  return null;
}

export default function GymNotificacionesPage() {
  const { api, user } = useAuth();
  const { notifications, unreadCount, loading, markOneRead, markAllRead } = useNotifications();
  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    api.get<CoachClientSummary[]>("/coach/clients").then(setClients).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (!loading && unreadCount > 0) markAllRead();
  }, [loading, unreadCount, markAllRead]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const enriched = useMemo(() => {
    return notifications.map((n) => {
      const clientId = extractClientIdFromLinkUrl(n.linkUrl);
      const client = clientId ? clientMap.get(clientId) ?? null : null;
      return { ...n, _clientId: clientId, _clientName: client ? (client.name ?? client.email) : null };
    });
  }, [notifications, clientMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((n) => {
      if (selectedClientId !== "all" && n._clientId !== selectedClientId) return false;
      if (typeFilter !== "all" && notificationTypeGroup(n.type) !== typeFilter) return false;
      if (!q) return true;
      return `${n.title} ${n.body ?? ""} ${n._clientName ?? ""}`.toLowerCase().includes(q);
    });
  }, [enriched, search, selectedClientId, typeFilter]);

  return (
    <DesktopShell active="notifications" coachName={user?.name ?? "Gym"}>
      <div style={{ padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Notificaciones</div>
            {unreadCount > 0 && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>{unreadCount} sin leer</div>}
          </div>
          {unreadCount > 0 && <Button variant="outline" size="sm" icon="check" onClick={markAllRead}>Marcar todas</Button>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 18, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input label="Buscar" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} style={{ height: 36, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--text)", fontSize: 13, padding: "0 10px", outline: "none" }}>
              <option value="all">Todos</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
            </select>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["all", "messages", "sessions", "clients"] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${typeFilter === t ? "var(--lime)" : "var(--line-2)"}`, background: typeFilter === t ? "rgba(215,255,58,.10)" : "transparent", color: typeFilter === t ? "var(--text)" : "var(--text-mute)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {t === "all" ? "Todas" : t === "messages" ? "Mensajes" : t === "sessions" ? "Sesiones" : "Alumnos"}
                </button>
              ))}
            </div>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)" }}>Cargando…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "var(--text-mute)" }}>
                <Icon name="bell" size={32} color="var(--text-dim)" />
                <div style={{ marginTop: 12 }}>Sin notificaciones</div>
              </div>
            ) : (
              <GroupedNotificationsList items={filtered} clientMap={clientMap} onMarkRead={markOneRead} />
            )}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}
