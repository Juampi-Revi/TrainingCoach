"use client";

import { Avatar, Badge } from "@/components/ui";
import type { ClientDetail } from "./_types";
import { daysSince, normalizeEnergyRating } from "./_utils";
import type { SessionSummary } from "@regen/types";

interface ClientHeaderProps {
  client: ClientDetail;
}

interface KpiStat {
  l: string;
  v: string;
}

function buildKpis(
  client: ClientDetail,
  sessions: SessionSummary[],
  completed: SessionSummary[],
  energyAvg: number | null,
  latestWeight: number | undefined,
): KpiStat[] {
  return [
    { l: "Sesiones", v: String(completed.length) },
    {
      l: "Última",
      v: sessions[0] ? `Hace ${daysSince(sessions[0].performedAt)}d` : "—",
    },
    { l: "Energía", v: energyAvg != null ? `${energyAvg.toFixed(1)}/5` : "—" },
    { l: "Peso", v: latestWeight ? `${latestWeight}kg` : "—" },
  ];
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const name = client.name ?? client.email;
  const sessions = client.recentSessions ?? [];
  const completed = sessions.filter((s) => s.status === "completed");
  const energyVals = completed
    .map((s) => normalizeEnergyRating(s.energyRating))
    .filter((v): v is number => v != null);
  const energyAvg = energyVals.length
    ? energyVals.reduce((a, b) => a + b, 0) / energyVals.length
    : null;
  const weightData = client.weightHistory ?? [];
  const latestWeight = weightData[0]?.weight;
  const kpis = buildKpis(client, sessions, completed, energyAvg, latestWeight);

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        padding: "20px 0 24px",
        borderBottom: "1px solid var(--line)",
        alignItems: "center",
      }}
    >
      <Avatar name={name} size={72} tone="var(--lime)" textColor="var(--text-on-accent)" />
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
        {kpis.map((m) => (
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
  );
}
