"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Icon } from "@/components/ui";
import type { CoachCalendarResponse, SessionStatus } from "@regen/types";

function labelForStatus(status: SessionStatus | null) {
  if (!status) return "Pendiente";
  if (status === "in_progress") return "En curso";
  if (status === "partial") return "Parcial";
  if (status === "completed") return "Completado";
  return "Descartado";
}

function toneForStatus(status: SessionStatus | null) {
  if (!status) return "neutral" as const;
  if (status === "completed") return "success" as const;
  if (status === "partial") return "warn" as const;
  if (status === "in_progress") return "warn" as const;
  return "neutral" as const;
}

export function AgendaWeekOverview({
  weekOverview,
  onEditNote,
}: {
  weekOverview: NonNullable<CoachCalendarResponse["weekOverview"]>;
  onEditNote?: (args: { planId: string; pwwId: string; workoutTitle: string; value: string | null }) => void;
}) {
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const totals = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const c of weekOverview) {
      total += c.workouts.length;
      completed += c.workouts.filter((w) => w.session?.status === "completed").length;
    }
    return { completed, total };
  }, [weekOverview]);

  if (weekOverview.length === 0) return null;

  return (
    <Card pad={14} style={{ marginBottom: 12, position: "sticky", top: 12, zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="calendar" size={16} color="var(--lime)" />
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.01em" }}>Semana (pendientes / hechas)</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Badge tone={totals.completed === totals.total ? "success" : "warn"} size="sm">
            {totals.completed}/{totals.total}
          </Badge>
          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
            El alumno puede hacerlos en cualquier orden
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weekOverview.map((c) => {
          const completed = c.workouts.filter((w) => w.session?.status === "completed").length;
          const total = c.workouts.length;
          const pending = total - completed;
          const collapsed = collapsedIds[c.client.id] ?? false;
          return (
            <div
              key={c.client.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 12,
                background: "var(--bg-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="ta-ellipsis" style={{ fontSize: 14, fontWeight: 800 }}>
                    {c.client.name?.trim() || c.client.email}
                  </div>
                  <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                    {c.assignment.plan.title} · Sem {c.weekNumber ?? "—"} · Inicio {c.assignment.startDate ?? "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge tone={pending > 0 ? "warn" : "success"} size="sm">
                    {completed}/{total}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCollapsedIds((prev) => ({ ...prev, [c.client.id]: !(prev[c.client.id] ?? false) }))}
                  >
                    {collapsed ? "Ver" : "Ocultar"}
                  </Button>
                  <Button as={Link} href={`/coach/alumnos/${c.client.id}`} size="sm" variant="outline">
                    Alumno
                  </Button>
                </div>
              </div>

              {!collapsed && c.workouts.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginTop: 10 }}>
                  {c.workouts.map((w) => (
                    <div
                      key={w.pwwId}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                        padding: 10,
                        background: "var(--bg-1)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 800 }}>
                          {w.title}
                        </div>
                        <Badge tone={toneForStatus(w.session?.status ?? null)} size="sm">
                          {labelForStatus(w.session?.status ?? null)}
                        </Badge>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                        <div className="ta-ellipsis" style={{ fontSize: 12, color: w.progressionNote ? "var(--accent-text)" : "var(--text-mute)", fontWeight: 700, minWidth: 0 }}>
                          {w.progressionNote ?? "—"}
                        </div>
                        {onEditNote && w.pwwId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="edit"
                            title="Editar nota"
                            ariaLabel="Editar nota"
                            onClick={() => onEditNote({ planId: c.assignment.plan.id, pwwId: w.pwwId, workoutTitle: w.title, value: w.progressionNote ?? null })}
                            style={{ padding: "0 8px" }}
                          />
                        )}
                      </div>
                      <div className="ta-ellipsis ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                        {w.exerciseCount} ej{w.tags.length ? ` · ${w.tags.join(" · ")}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
