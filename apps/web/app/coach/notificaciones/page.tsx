"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { Icon, Button, Input } from "@/components/ui";
import { useNotifications } from "@/lib/use-notifications";
import type { CoachClientSummary } from "@regen/types";
import { CoachNotificationSettingsCard } from "./_components/coach-notification-settings-card";
import { GroupedNotificationsList } from "./_components/grouped-notifications-list";

type TypeFilter = "all" | "messages" | "sessions" | "clients" | "plans" | "other";

function notificationTypeGroup(type: string): TypeFilter {
  if (type === "new_message") return "messages";
  if (type === "session_completed") return "sessions";
  if (type === "client_added" || type === "client_inactive") return "clients";
  if (type === "plan_assigned") return "plans";
  return "other";
}

function extractClientIdFromLinkUrl(url: string | null): string | null {
  if (!url) return null;
  const m1 = url.match(/^\/coach\/alumnos\/([^/]+)/);
  if (m1?.[1]) return m1[1];
  const m2 = url.match(/^\/coach\/mensajes\/([^/]+)/);
  if (m2?.[1]) return m2[1];
  return null;
}

export default function CoachNotificacionesPage() {
  const { user, api } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, refresh } = useNotifications();
  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    api
      .get<CoachClientSummary[]>("/coach/clients")
      .then(setClients)
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, [api]);

  const clientMap = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c]));
  }, [clients]);

  const enriched = useMemo(() => {
    return notifications.map((n) => {
      const clientId = extractClientIdFromLinkUrl(n.linkUrl);
      const client = clientId ? clientMap.get(clientId) ?? null : null;
      const clientName = client ? (client.name ?? client.email) : null;
      return { ...n, _clientId: clientId, _clientName: clientName };
    });
  }, [notifications, clientMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((n) => {
      if (selectedClientId !== "all" && n._clientId !== selectedClientId) return false;
      if (typeFilter !== "all" && notificationTypeGroup(n.type) !== typeFilter) return false;
      if (!q) return true;
      const haystack = `${n.title} ${n.body ?? ""} ${n._clientName ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [enriched, search, selectedClientId, typeFilter]);

  const clientOptions = useMemo(() => {
    const items = [...clients].sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
    return items.map((c) => ({ id: c.id, label: c.name ?? c.email }));
  }, [clients]);

  function typeChipStyle(active: boolean, tone: "lime" | "blue" | "amber" | "neutral") {
    const toneColor =
      tone === "lime" ? "var(--lime)" : tone === "blue" ? "#7AB8FF" : tone === "amber" ? "#FFB547" : "var(--text-mute)";
    return {
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? toneColor : "var(--line-2)"}`,
      background: active ? "rgba(215,255,58,.10)" : "transparent",
      color: active ? "var(--text)" : "var(--text-mute)",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap" as const,
    };
  }

  return (
    <DesktopShell active="notifications" coachName={user?.name ?? "Coach"}>
      <div className="coach-notifs">
        <div className="coach-notifs-header">
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>Notificaciones</div>
            {unreadCount > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>{unreadCount} sin leer</div>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon="check"
              title="Marcar todas como leídas"
              ariaLabel="Marcar todas como leídas"
              onClick={markAllRead}
            >
              Marcar todas
            </Button>
          )}
        </div>

        <div className="coach-notifs-grid">
          <div className="coach-notifs-filters">
            <CoachNotificationSettingsCard api={api} onAfterChange={refresh} />

            <Input
              label="Buscar"
              placeholder="Buscar por alumno, título o texto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="coach-notifs-filter-row">
              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
                  ALUMNO
                </div>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={clientsLoading}
                  style={{
                    width: "100%",
                    height: 36,
                    borderRadius: 10,
                    background: "var(--bg-2)",
                    border: "1px solid var(--line-2)",
                    color: "var(--text)",
                    fontSize: 13,
                    padding: "0 10px",
                    outline: "none",
                    opacity: clientsLoading ? 0.6 : 1,
                  }}
                >
                  <option value="all">Todos</option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
                  TIPO
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={typeChipStyle(typeFilter === "all", "neutral")} onClick={() => setTypeFilter("all")}>Todas</button>
                  <button style={typeChipStyle(typeFilter === "messages", "blue")} onClick={() => setTypeFilter("messages")}>Mensajes</button>
                  <button style={typeChipStyle(typeFilter === "sessions", "lime")} onClick={() => setTypeFilter("sessions")}>Sesiones</button>
                  <button style={typeChipStyle(typeFilter === "clients", "amber")} onClick={() => setTypeFilter("clients")}>Alumnos</button>
                </div>
              </div>
            </div>
          </div>

          <div className="coach-notifs-list">
            {!loading && notifications.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 10 }}>
                Mostrando {filtered.length} de {notifications.length}
              </div>
            )}

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
                <Icon name="bell" size={32} color="var(--text-dim)" />
                <div style={{ marginTop: 12 }}>Sin notificaciones</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
                No hay resultados con esos filtros.
              </div>
            ) : (
              <GroupedNotificationsList items={filtered} clientMap={clientMap} />
            )}
          </div>
        </div>

        <style jsx>{`
          .coach-notifs {
            width: 100%;
            padding: 24px 20px;
            box-sizing: border-box;
          }

          .coach-notifs-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 16px;
          }

          .coach-notifs-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .coach-notifs-filters {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .coach-notifs-filter-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .coach-notifs-list {
            min-width: 0;
          }

          @media (min-width: 980px) {
            .coach-notifs {
              padding: 28px;
            }

            .coach-notifs-grid {
              grid-template-columns: 360px 1fr;
              gap: 18px;
              align-items: start;
            }

            .coach-notifs-filters {
              position: sticky;
              top: 12px;
              align-self: start;
              background: transparent;
            }

            .coach-notifs-filter-row {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
        `}</style>
      </div>
    </DesktopShell>
  );
}
