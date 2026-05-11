"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { CoachCalendarResponse } from "@regen/types";

export function AgendaActionableIssues({
  mode,
  clientId,
  loading,
  data,
  calendarMode,
}: {
  mode: "Semana" | "Día" | "Mes";
  clientId: string;
  loading: boolean;
  data: CoachCalendarResponse | null;
  calendarMode: "flex" | "fixed";
}) {
  const router = useRouter();

  const issues = useMemo(() => {
    if (mode === "Mes") return [];
    if (!clientId || loading || !data) return [];

    const selected = data.weekOverview?.find((x) => x.client.id === clientId) ?? null;
    const out: Array<{ title: string; body: string; ctaLabel: string; href: string }> = [];

    if (!selected) {
      out.push({
        title: "Este alumno no tiene un plan activo/pausado",
        body: "Asigná un plan para que aparezcan pendientes de la semana y para poder linkear sesiones con D1/D2…",
        ctaLabel: "Ver alumno",
        href: `/coach/alumnos/${clientId}`,
      });
      return out;
    }

    if (calendarMode === "fixed" && !selected.assignment.startDate) {
      out.push({
        title: "Falta “Inicio del plan”",
        body: "En modo “Plan fijo”, D1 se calcula desde la fecha de inicio. Sin inicio, no podemos mapear a días.",
        ctaLabel: "Abrir plan",
        href: `/coach/planes/${selected.assignment.plan.id}`,
      });
    }

    if (selected.workouts.length === 0) {
      out.push({
        title: "Este plan no tiene entrenos en la semana",
        body: "Cargá workouts en la grilla del plan para que el alumno tenga un pool de entrenos para elegir.",
        ctaLabel: "Editar plan",
        href: `/coach/planes/${selected.assignment.plan.id}`,
      });
    }

    return out;
  }, [calendarMode, clientId, data, loading, mode]);

  if (issues.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
      {issues.map((i) => (
        <div key={i.title} style={{ padding: 12, borderRadius: 12, background: "var(--bg-1)", border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{i.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4, lineHeight: 1.45 }}>{i.body}</div>
          <div style={{ marginTop: 10 }}>
            <Button size="sm" variant="outline" onClick={() => router.push(i.href)}>
              {i.ctaLabel}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

