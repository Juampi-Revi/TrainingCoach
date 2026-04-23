"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Badge, Button, Card, Icon, Progress, StateBlock, Tabs } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { SessionSummary } from "@regen/types";

interface ClientDetail {
  id: string;
  name: string | null;
  email: string;
  assignment: {
    status: string;
    plan: { id: string; title: string; weeksCount: number } | null;
    weekNumber?: number;
  } | null;
  recentSessions: SessionSummary[];
  weightHistory: { recordedAt: string; weight: number }[];
}

interface ApiClientResponse {
  client: { id: string; name: string | null; email: string; assignment: ClientDetail["assignment"] };
  recentSessions: SessionSummary[];
  weightHistory: { measuredAt: string; weightKg: string | null }[];
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function AthleteDetailPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { clientUserId } = useParams<{ clientUserId: string }>();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Historial");
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    api
      .get<ApiClientResponse>(`/coach/clients/${clientUserId}`)
      .then((data) => {
        setClient({
          ...data.client,
          recentSessions: data.recentSessions,
          weightHistory: data.weightHistory.map((w) => ({
            recordedAt: w.measuredAt,
            weight: w.weightKg ? parseFloat(w.weightKg) : 0,
          })),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, clientUserId]);

  if (loading) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="loading" title="Cargando alumno…" />
      </DesktopShell>
    );
  }

  if (!client) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="error" title="Alumno no encontrado" />
      </DesktopShell>
    );
  }

  const name = client.name ?? client.email;
  const sessions = client.recentSessions ?? [];
  const completed = sessions.filter((s) => s.status === "completed");

  const weightData = client.weightHistory ?? [];
  const latestWeight = weightData[0]?.weight;
  const prevWeight = weightData[1]?.weight;
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
    <DesktopShell
      active="athletes"
      title={
        <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
          Alumnos{" "}
          <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>{name}</span>
        </span>
      }
      subtitle={`${client.email}${client.assignment?.plan ? ` · ${client.assignment.plan.title}` : ""}`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            icon="chevL"
            onClick={() => router.push("/coach/alumnos")}
          >
            Volver
          </Button>
          {client.assignment?.plan && (
            <Button
              variant="outline"
              size="sm"
              icon="edit"
              onClick={() => router.push(`/coach/planes/${client.assignment!.plan!.id}`)}
            >
              Ver plan
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={unlinking}
            onClick={async () => {
              if (!confirm(`¿Desvincular a ${client.name ?? client.email}? Perderás acceso a sus datos.`)) return;
              setUnlinking(true);
              try {
                await api.del(`/coach/clients/${clientUserId}`);
                router.replace("/coach/alumnos");
              } catch {
                setUnlinking(false);
              }
            }}
            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
          >
            {unlinking ? "Desvinculando…" : "Desvincular"}
          </Button>
        </>
      }
    >
      <div style={{ padding: "0 28px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            gap: 20,
            padding: "20px 0 24px",
            borderBottom: "1px solid var(--line)",
            alignItems: "center",
          }}
        >
          <Avatar name={name} size={72} tone="var(--lime)" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{name}</div>
              {client.assignment?.status === "active" ? (
                <Badge tone="success">Activo</Badge>
              ) : (
                <Badge tone="neutral">Sin plan</Badge>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 3 }}>
              {client.email}
            </div>
            {client.assignment?.plan && (
              <div style={{ marginTop: 8 }}>
                <Badge tone="neutral">{client.assignment.plan.title}</Badge>
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              paddingLeft: 24,
              borderLeft: "1px solid var(--line)",
            }}
          >
            {[
              { l: "Sesiones", v: String(completed.length) },
              {
                l: "Última",
                v:
                  sessions[0]
                    ? `Hace ${daysSince(sessions[0].performedAt)}d`
                    : "—",
              },
              { l: "Peso actual", v: latestWeight ? `${latestWeight}kg` : "—" },
            ].map((m) => (
              <div key={m.l}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontWeight: 600,
                  }}
                >
                  {m.l}
                </div>
                <div className="ta-mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, padding: "18px 0 0" }}>
          <Tabs
            tabs={["Historial", "Métricas"]}
            active={tab}
            onChange={setTab}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 18,
            padding: "18px 0 28px",
          }}
        >
          {/* Left: sessions timeline */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sesiones recientes</div>
            </div>

            {sessions.length === 0 ? (
              <StateBlock kind="empty" title="Sin sesiones" body="Este alumno aún no completó ninguna sesión." />
            ) : (
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 8,
                    top: 8,
                    bottom: 8,
                    width: 1,
                    background: "var(--line)",
                  }}
                />
                {sessions.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      gap: 14,
                      marginBottom: 10,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: -20,
                        top: 14,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        background:
                          s.status === "completed" ? "var(--lime)" : "var(--bg-2)",
                        border: `2px solid ${s.status === "completed" ? "var(--lime)" : "var(--line-2)"}`,
                      }}
                    />
                    <div
                      onClick={() =>
                        router.push(
                          `/coach/alumnos/${clientUserId}/sesiones/${s.id}`
                        )
                      }
                      style={{
                        flex: 1,
                        padding: 12,
                        background: "var(--bg-1)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      className="ta-row"
                    >
                      <div
                        className="ta-mono"
                        style={{ fontSize: 11, color: "var(--text-mute)", width: 64 }}
                      >
                        {new Date(s.performedAt).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {s.workoutTemplate?.title ?? "Sesión libre"}
                        </div>
                        {s.status === "completed" && (
                          <div
                            className="ta-mono"
                            style={{
                              fontSize: 11,
                              color: "var(--text-mute)",
                              marginTop: 2,
                            }}
                          >
                            {s.setsCount} sets ·{" "}
                            {Math.round(s.totalVolumeKg).toLocaleString("es")}kg
                          </div>
                        )}
                      </div>
                      <Icon name="chevR" size={14} color="var(--text-mute)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {client.assignment?.plan && (
              <Card pad={16}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Plan activo</div>
                  {client.assignment.weekNumber != null && (
                    <Badge tone="limeSoft">
                      S{client.assignment.weekNumber}/{client.assignment.plan.weeksCount}
                    </Badge>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "-.01em",
                  }}
                >
                  {client.assignment.plan.title}
                </div>
                {client.assignment.weekNumber != null && (
                  <>
                    <Progress
                      value={client.assignment.weekNumber}
                      total={client.assignment.plan.weeksCount}
                      style={{ marginTop: 14 }}
                    />
                    <div
                      className="ta-mono"
                      style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}
                    >
                      Semana {client.assignment.weekNumber} de{" "}
                      {client.assignment.plan.weeksCount}
                    </div>
                  </>
                )}
              </Card>
            )}

            {weightData.length > 0 && (
              <Card pad={16}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                  Peso corporal
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <span className="ta-mono" style={{ fontSize: 24, fontWeight: 600 }}>
                    {latestWeight}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-mute)" }}>kg</span>
                  {weightDiff && (
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          Number(weightDiff) < 0 ? "var(--danger)" : "var(--success)",
                        marginLeft: 4,
                      }}
                    >
                      {Number(weightDiff) > 0 ? "+" : ""}
                      {weightDiff}kg
                    </span>
                  )}
                </div>
                {weightData.length > 1 && (
                  <svg
                    width="100%"
                    height="48"
                    viewBox="0 0 200 48"
                    style={{ marginTop: 10 }}
                    preserveAspectRatio="none"
                  >
                    {weightData
                      .slice(0, 10)
                      .reverse()
                      .map((w, i, arr) => {
                        const min = Math.min(...arr.map((x) => x.weight));
                        const max = Math.max(...arr.map((x) => x.weight));
                        const range = max - min || 1;
                        const x = (i / (arr.length - 1)) * 200;
                        const y = 48 - (((w.weight - min) / range) * 32 + 8);
                        if (i === 0) return null;
                        const px =
                          ((i - 1) / (arr.length - 1)) * 200;
                        const py =
                          48 -
                          (((arr[i - 1].weight - min) / range) * 32 + 8);
                        return (
                          <line
                            key={i}
                            x1={px}
                            y1={py}
                            x2={x}
                            y2={y}
                            stroke="var(--lime)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        );
                      })}
                  </svg>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}
