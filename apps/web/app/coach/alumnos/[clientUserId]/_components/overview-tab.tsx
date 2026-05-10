"use client";

import { Button, Card, Icon, KPI, StateBlock } from "@/components/ui";
import type { ClientDetail, WeeklySummary } from "./_types";
import { SessionsList } from "./sessions-list";

function fmtSleep(avgMinutes: number | null) {
  if (avgMinutes == null) return "—";
  const h = avgMinutes / 60;
  return h >= 10 ? h.toFixed(1) : h.toFixed(1);
}

function fmtSteps(total: number) {
  if (total >= 10000) return `${Math.round(total / 1000)}k`;
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k`;
  return String(total);
}

function sectionTitle(label: string) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function summaryKpis(s: WeeklySummary, labelSuffix: string) {
  const days = Math.max(1, s.range.days);
  const stepsAvg = Math.round(s.health.stepsTotal / days);
  const sleepAvg = s.health.sleepAvgMinutes;
  const sportAvg = Math.round(s.health.sportMinutesTotal / days);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
      <KPI label={`Pasos${labelSuffix}`} value={fmtSteps(stepsAvg)} unit="avg/día" />
      <KPI label={`Sueño${labelSuffix}`} value={fmtSleep(sleepAvg)} unit="h avg" />
      <KPI label={`Comidas${labelSuffix}`} value={s.food.count} unit={`${days}d`} />
      <KPI label={`Entrenos${labelSuffix}`} value={s.workouts.completed} unit={`${days}d`} hint={sportAvg > 0 ? `+${sportAvg} min/d de deporte` : undefined} />
    </div>
  );
}

interface OverviewTabProps {
  client: ClientDetail;
  clientUserId: string;
  today: WeeklySummary | null;
  week: WeeklySummary | null;
  month: WeeklySummary | null;
  loading: boolean;
  onViewTraining: () => void;
}

export function OverviewTab({ client, clientUserId, today, week, month, loading, onViewTraining }: OverviewTabProps) {
  if (loading || !today || !week || !month) {
    return <StateBlock kind="loading" title="Cargando resumen…" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card pad={16}>
        {sectionTitle("HOY")}
        <div style={{ marginTop: 12 }}>
          {today.health.daysWithEntry === 0 && today.food.count === 0 && today.workouts.total === 0 ? (
            <StateBlock kind="empty" title="Sin registros hoy" body="Todavía no cargó salud, comida o entrenos." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
              <KPI label="Pasos" value={fmtSteps(today.health.stepsTotal)} unit="hoy" />
              <KPI label="Sueño" value={today.health.sleepAvgMinutes != null ? fmtSleep(today.health.sleepAvgMinutes) : "—"} unit="h" />
              <KPI label="Comidas" value={today.food.count} unit="hoy" />
              <KPI label="Entrenos" value={today.workouts.completed} unit="hoy" />
            </div>
          )}
        </div>
      </Card>

      <Card pad={16}>
        {sectionTitle("SEMANA")}
        <div style={{ marginTop: 12 }}>{summaryKpis(week, "")}</div>
      </Card>

      <Card pad={16}>
        {sectionTitle("MES")}
        <div style={{ marginTop: 12 }}>{summaryKpis(month, "")}</div>
      </Card>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={16} />
            Entrenos recientes
          </div>
          <Button variant="ghost" size="sm" onClick={onViewTraining}>Ver todo</Button>
        </div>
        <SessionsList sessions={(client.recentSessions ?? []).slice(0, 8)} clientUserId={clientUserId} showStatus />
      </div>
    </div>
  );
}

