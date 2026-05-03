"use client";

import { Button, Card, Icon, StateBlock } from "@/components/ui";
import type { ClientDetail, WeeklySummary } from "./_types";
import { SessionsList } from "./sessions-list";
import { daysSince, normalizeEnergyRating, fmtSleep } from "./_utils";

interface SummaryTabProps {
  client: ClientDetail;
  summary: WeeklySummary | null;
  summaryLoading: boolean;
  clientUserId: string;
  onViewAllSessions: () => void;
}

export function SummaryTab({ client, summary, summaryLoading, clientUserId, onViewAllSessions }: SummaryTabProps) {
  const sessions = client.recentSessions ?? [];
  const completed = sessions.filter((s) => s.status === "completed");
  const energyVals = completed
    .map((s) => normalizeEnergyRating(s.energyRating))
    .filter((v): v is number => v != null);
  const energyAvg = energyVals.length
    ? energyVals.reduce((a, b) => a + b, 0) / energyVals.length
    : null;
  const latestWeight = client.weightHistory?.[0]?.weight;

  const kpiCards = [
    { label: "Sesiones (30d)", value: String(completed.length) },
    { label: "Última sesión", value: sessions[0] ? `${daysSince(sessions[0].performedAt)}d` : "—" },
    { label: "Energía prom", value: energyAvg != null ? `${energyAvg.toFixed(1)}/5` : "—" },
    { label: "Peso actual", value: latestWeight ? `${latestWeight}kg` : "—" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} pad={16}>
            <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
              {kpi.label}
            </div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {kpi.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="chart" size={16} color="var(--text-mute)" />
            <div style={{ fontSize: 13, fontWeight: 700 }}>Resumen (7 días)</div>
          </div>
          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
            {summary?.range ? `${summary.range.start} → ${summary.range.end}` : summaryLoading ? "…" : "—"}
          </div>
        </div>
        {summaryLoading || !summary ? (
          <div style={{ marginTop: 8 }}>
            <StateBlock kind="loading" title="Cargando resumen…" />
          </div>
        ) : (
          <div className="ta-mono" style={{ marginTop: 10, fontSize: 12, color: "var(--text-mute)" }}>
            Pasos: {summary.health.stepsTotal.toLocaleString("es")}
            {" · "} Sueño prom: {fmtSleep(summary.health.sleepAvgMinutes)}
            {" · "} Deporte: {summary.health.sportMinutesTotal}m
            {" · "} Comidas: {summary.food.count}
            {" · "} Entrenos: {summary.workouts.completed}/{summary.workouts.total}
            {summary.latestWeight
              ? ` · Peso: ${parseFloat(summary.latestWeight.weightKg).toFixed(1)}kg (${summary.latestWeight.measuredAt})`
              : ""}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Sesiones recientes</div>
        <Button variant="ghost" size="sm" onClick={onViewAllSessions}>Ver todo</Button>
      </div>

      <SessionsList sessions={sessions} clientUserId={clientUserId} limit={6} />
    </div>
  );
}
