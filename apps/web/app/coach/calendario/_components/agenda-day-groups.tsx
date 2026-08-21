"use client";

import Link from "next/link";
import { Badge, Button, Card, Icon } from "@/components/ui";
import type { CoachCalendarItem, SessionStatus } from "@regen/types";

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

function timeOfDay(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function AgendaDayGroups({
  grouped,
  mode,
  onEditNote,
}: {
  grouped: Array<{ date: string; items: CoachCalendarItem[] }>;
  mode: "fixed" | "flex";
  onEditNote?: (args: { planId: string; pwwId: string; workoutTitle: string; value: string | null }) => void;
}) {
  if (grouped.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {grouped.map((d) => {
        const day = new Date(`${d.date}T00:00:00.000Z`);
        const label = day.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" });
        return (
          <Card key={d.date} pad={14}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-.01em", textTransform: "capitalize" }}>
                  {label}
                </div>
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                  {d.items.length} item{d.items.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                {d.date}
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {d.items.map((it) => {
                const status = it.session?.status ?? null;
                const sessionTime = timeOfDay(it.session?.performedAt ?? null);
                return (
                  <div
                    key={it.session?.id ?? `${it.date}-${it.client.id}-${it.workout?.pwwId ?? it.workout?.workoutTemplateId ?? "x"}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1.2fr 1.6fr 1.8fr auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700 }}>
                        {it.client.name?.trim() || it.client.email}
                      </div>
                      <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                        {it.client.email}
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700 }}>
                        {it.assignment.plan.title}
                      </div>
                      {mode === "fixed" ? (
                        <>
                          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                            Sem {it.weekNumber ?? "—"} · D{it.sortOrder != null ? it.sortOrder + 1 : "—"}
                          </div>
                          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
                            D1 = {it.assignment.startDate ?? "sin inicio"}
                          </div>
                        </>
                      ) : (
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                          {sessionTime ? `Sesión ${sessionTime}` : "Sesión"}{it.weekNumber ? ` · Sem ${it.weekNumber}` : ""}
                        </div>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700 }}>
                        {it.workout?.title ?? "—"}
                      </div>
                      <div className="ta-ellipsis ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                        {it.workout ? `${it.workout.exerciseCount} ej${it.workout.tags.length ? ` · ${it.workout.tags.join(" · ")}` : ""}` : ""}
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                        <div className="ta-ellipsis" style={{ fontSize: 12, color: it.workout?.progressionNote ? "var(--accent-text)" : "var(--text-mute)", fontWeight: 700, minWidth: 0 }}>
                          {it.workout?.progressionNote ?? "—"}
                        </div>
                        {onEditNote && it.workout?.pwwId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="edit"
                            title="Editar nota"
                            ariaLabel="Editar nota"
                            onClick={() => onEditNote({ planId: it.assignment.plan.id, pwwId: it.workout!.pwwId, workoutTitle: it.workout!.title, value: it.workout!.progressionNote ?? null })}
                            style={{ padding: "0 8px" }}
                          />
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                      <Badge tone={toneForStatus(status)} size="sm">
                        {labelForStatus(status)}
                      </Badge>
                      <Button as={Link} href={`/coach/alumnos/${it.client.id}`} size="sm" variant="outline">
                        Alumno
                      </Button>
                      {it.workout && (
                        <Button as={Link} href={`/coach/workouts/${it.workout.workoutTemplateId}`} size="sm" variant="outline">
                          Entreno
                        </Button>
                      )}
                      {it.session && (
                        <Button as={Link} href={`/coach/alumnos/${it.client.id}/sesiones/${it.session.id}`} size="sm" variant="outline">
                          Sesión
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {d.items.length === 0 && (
                <div style={{ padding: "12px 10px", color: "var(--text-mute)", fontSize: 13 }}>
                  Sin datos
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
