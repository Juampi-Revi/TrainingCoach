"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Badge, Button, Card, Icon, KPI, Progress, StateBlock, Table } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { CoachClientSummary } from "@regen/types";
import { AVATAR_TONES } from "@/lib/constants";

export default function CoachDashboardPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    api
      .get<CoachClientSummary[]>("/coach/clients")
      .then(setClients)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "No se pudo cargar alumnos"))
      .finally(() => setLoading(false));
  }, [api, toast]);

  const activeClients = clients.filter((c) => c.assignment?.status === "active");
  const inactiveClients = clients.filter((c) => {
    if (!c.lastSession) return true;
    const diff = (new Date().getTime() - new Date(c.lastSession.performedAt).getTime()) / 86400000;
    return diff > 7;
  });

  const alertRows = inactiveClients.slice(0, 5).map((c, i) => {
    const days = c.lastSession
      ? Math.floor((new Date().getTime() - new Date(c.lastSession.performedAt).getTime()) / 86400000)
      : null;
    return {
      name: (
        <Link
          href={`/coach/alumnos/${c.id}`}
          style={{ display: "flex", alignItems: "center", gap: 10, color: "inherit", textDecoration: "none" }}
        >
          <Avatar name={c.name ?? c.email} size={30} tone={AVATAR_TONES[i % AVATAR_TONES.length]} />
          <span style={{ fontWeight: 600 }}>{c.name ?? c.email}</span>
        </Link>
      ),
      plan: (
        <span style={{ color: "var(--text-mute)" }}>
          {c.assignment?.plan?.title ?? "Sin plan"}
        </span>
      ),
      last: days !== null ? `Hace ${days}d` : "Nunca",
      alert: days && days > 7
        ? <Badge tone="danger" icon="alert">Sin entrenar {days}d</Badge>
        : <Badge tone="warn">Revisar</Badge>,
    };
  });

  return (
    <DesktopShell
      active="dashboard"
      title="Dashboard"
      subtitle={`${today.charAt(0).toUpperCase()}${today.slice(1)} · ${new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => router.push("/coach/alumnos")}>
            Ver alumnos
          </Button>
          <Button size="sm" icon="plus" onClick={() => router.push("/coach/planes")}>
            Nuevo plan
          </Button>
        </>
      }
    >
      <div className="coach-pad">
        {/* KPIs */}
        <div className="coach-kpi-grid" style={{ marginBottom: 24 }}>
          <KPI
            label="Alumnos activos"
            value={String(activeClients.length)}
            hint="con plan asignado"
          />
          <KPI
            label="Sin entrenar 7d+"
            value={String(inactiveClients.length)}
            hint="requieren atención"
          />
          <KPI label="Total alumnos" value={String(clients.length)} hint="en tu cuenta" />
        </div>

        {loading ? (
          <StateBlock kind="loading" title="Cargando alumnos…" />
        ) : (
          <div className="coach-two-col">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <Icon name="alert" size={16} color="var(--text)" />
                <h2
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-.01em",
                  }}
                >
                  Requieren atención
                </h2>
                {inactiveClients.length > 0 && (
                  <Badge tone="danger">{inactiveClients.length}</Badge>
                )}
              </div>

              {alertRows.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "var(--text-mute)",
                    fontSize: 13,
                    background: "var(--bg-1)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                  }}
                >
                  Todos tus alumnos están al día
                </div>
              ) : (
                <Table
                  cols={[
                    { key: "name", label: "Alumno", w: "2fr" },
                    { key: "plan", label: "Plan", w: "2fr" },
                    { key: "last", label: "Última ses.", w: "1.2fr", mono: true, mute: true },
                    { key: "alert", label: "Alerta", w: "1.4fr" },
                  ]}
                  rows={alertRows}
                  onRowClick={(i) => router.push(`/coach/alumnos/${inactiveClients[i]?.id}`)}
                />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Card pad={16}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-mute)",
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        fontWeight: 600,
                      }}
                    >
                      Alumnos · distribución
                    </div>
                    <div
                      className="ta-mono"
                      style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}
                    >
                      {activeClients.length}
                      <span
                        style={{ fontSize: 12, color: "var(--text-mute)", marginLeft: 4 }}
                      >
                        activos
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Con plan activo", count: activeClients.length, color: "var(--lime)" },
                    {
                      label: "Sin entrenar 7d+",
                      count: inactiveClients.length,
                      color: "var(--danger)",
                    },
                    {
                      label: "Sin plan",
                      count: clients.filter((c) => !c.assignment).length,
                      color: "var(--bg-3)",
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "var(--text-mute)" }}>{row.label}</span>
                        <span className="ta-mono" style={{ fontWeight: 600 }}>
                          {row.count}
                        </span>
                      </div>
                      <Progress
                        value={row.count}
                        total={clients.length || 1}
                        height={4}
                        color={row.color}
                      />
                    </div>
                  ))}
                </div>
              </Card>

              <Card pad={16}>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  Accesos rápidos
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { icon: "users" as const, t: "Lista de alumnos", href: "/coach/alumnos" },
                    { icon: "calendar" as const, t: "Agenda", href: "/coach/calendario" },
                    { icon: "msg" as const, t: "Mensajes", href: "/coach/mensajes" },
                    { icon: "calendar" as const, t: "Planes", href: "/coach/planes" },
                    { icon: "book" as const, t: "Entrenamientos", href: "/coach/workouts" },
                    { icon: "dumbbell" as const, t: "Ejercicios", href: "/coach/ejercicios" },
                  ].map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "10px 4px",
                        borderBottom: "1px solid var(--line)",
                        alignItems: "center",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                      className="ta-row"
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "var(--bg-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name={it.icon} size={14} color="var(--accent-text)" />
                      </div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{it.t}</div>
                      <Icon name="chevR" size={14} color="var(--text-mute)" />
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
