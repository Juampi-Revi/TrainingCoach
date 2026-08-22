"use client";

import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import type { ClientDetail, WeeklySummary } from "./_types";
import { daysSince } from "./_utils";

type RiskTone = "ok" | "warn" | "danger";

function buildRisk(client: ClientDetail): { label: string; tone: RiskTone; detail: string } {
  const last = client.recentSessions[0];
  const days = last ? daysSince(last.performedAt) : null;
  const hasPlan = client.assignment?.status === "active" && !!client.assignment.plan;

  if (!hasPlan) {
    return { label: "Sin plan", tone: "danger", detail: "Asigná un plan para retomar el seguimiento." };
  }
  if (days == null) {
    return { label: "Sin entrenos", tone: "danger", detail: "Todavía no registró ninguna sesión." };
  }
  if (days >= 7) {
    return { label: "Inactiva", tone: "danger", detail: `Sin actividad hace ${days} días.` };
  }
  if (days >= 4) {
    return { label: "Atención", tone: "warn", detail: `Último entreno hace ${days} días.` };
  }
  return {
    label: "On track",
    tone: "ok",
    detail: days === 0 ? "Entrenó hoy." : `Último entreno hace ${days} día${days === 1 ? "" : "s"}.`,
  };
}

function adherenceLabel(week: WeeklySummary | null): { value: string; sub: string } {
  if (!week) return { value: "—", sub: "Semana" };
  const done = week.workouts.completed;
  const total = week.workouts.total;
  if (total <= 0) return { value: "—", sub: "Sin planificados" };
  const pct = Math.round((done / total) * 100);
  return { value: `${pct}%`, sub: `${done}/${total} esta semana` };
}

function toneStyles(tone: RiskTone): { bg: string; border: string; color: string } {
  if (tone === "danger") {
    return {
      bg: "color-mix(in srgb, var(--danger) 12%, transparent)",
      border: "color-mix(in srgb, var(--danger) 35%, transparent)",
      color: "var(--danger)",
    };
  }
  if (tone === "warn") {
    return {
      bg: "color-mix(in srgb, var(--warn) 14%, transparent)",
      border: "color-mix(in srgb, var(--warn) 40%, transparent)",
      color: "var(--warn)",
    };
  }
  return {
    bg: "color-mix(in srgb, var(--lime) 10%, transparent)",
    border: "color-mix(in srgb, var(--lime) 32%, transparent)",
    color: "var(--lime)",
  };
}

export function DiagnosisHero({
  client,
  clientUserId,
  week,
  onMessage,
  onAssignPlan,
}: {
  client: ClientDetail;
  clientUserId: string;
  week: WeeklySummary | null;
  onMessage: () => void;
  onAssignPlan: () => void;
}) {
  const router = useRouter();
  const risk = buildRisk(client);
  const tones = toneStyles(risk.tone);
  const adherence = adherenceLabel(week);
  const last = client.recentSessions[0] ?? null;
  const planTitle = client.assignment?.plan?.title ?? null;
  const hasPlan = client.assignment?.status === "active" && !!planTitle;
  const lastDays = last ? daysSince(last.performedAt) : null;

  return (
    <div
      style={{
        marginTop: 4,
        marginBottom: 4,
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${tones.border}`,
        background: tones.bg,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="ta-mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: tones.color }}>
              DIAGNÓSTICO
            </span>
            <Badge tone={risk.tone === "ok" ? "success" : risk.tone === "warn" ? "warn" : "danger"}>
              {risk.label}
            </Badge>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: "var(--text)" }}>
            {risk.detail}
          </div>
          {planTitle && (
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4 }}>
              Plan: {planTitle}
              {client.assignment?.weekNumber != null ? ` · Semana ${client.assignment.weekNumber}` : ""}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700 }}>
              ADHERENCIA
            </div>
            <div className="ta-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{adherence.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{adherence.sub}</div>
          </div>
          <div style={{ minWidth: 140, maxWidth: 220 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700 }}>
              ÚLTIMA SESIÓN
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, lineHeight: 1.3 }}>
              {last?.workoutTemplate?.title ?? (last ? "Sesión" : "—")}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
              {last
                ? `${lastDays === 0 ? "Hoy" : `Hace ${lastDays}d`}${
                    last.energyRating != null ? ` · Energía ${last.energyRating}/10` : ""
                  }`
                : "Sin registros"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" icon="msg" onClick={onMessage}>
          Mensaje
        </Button>
        <Button size="sm" variant="secondary" icon="calendar" onClick={onAssignPlan}>
          {hasPlan ? "Cambiar plan" : "Asignar plan"}
        </Button>
        {last && (
          <Button
            size="sm"
            variant="secondary"
            icon="activity"
            onClick={() => router.push(`/coach/alumnos/${clientUserId}/sesiones/${last.id}`)}
          >
            Ver última sesión
          </Button>
        )}
        {hasPlan && client.assignment?.plan && (
          <Button
            size="sm"
            variant="ghost"
            icon="book"
            onClick={() => router.push(`/coach/planes/${client.assignment!.plan!.id}`)}
          >
            Abrir plan
          </Button>
        )}
      </div>
    </div>
  );
}
