"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, Icon } from "@/components/ui";
import type { PlanDetail } from "./types";

type Assignment = PlanDetail["assignments"][number];

function displayName(a: Assignment["client"]) {
  return a.displayName?.trim() || a.email;
}

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function periodFromStart(startDate: Date, now: Date, periodDays: number) {
  const start = startOfDayUTC(startDate).getTime();
  const current = startOfDayUTC(now).getTime();
  const diffDays = Math.floor((current - start) / 86_400_000);
  return Math.floor(diffDays / Math.max(1, periodDays)) + 1;
}

function computeCurrentWeekNumber(startDate: string | null, periodDays: number, totalWeeks: number) {
  if (!startDate) return 1;
  const d = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return 1;
  const raw = periodFromStart(d, new Date(), periodDays);
  return Math.max(1, Math.min(totalWeeks > 0 ? totalWeeks : 1, raw));
}

function statusLabel(status: Assignment["status"]) {
  if (status === "active") return "Activo";
  if (status === "paused") return "Pausado";
  return "Finalizado";
}

function statusTone(status: Assignment["status"]) {
  if (status === "active") return "lime";
  if (status === "paused") return "neutral";
  return "neutral";
}

export function PlanAssignments({
  planId,
  assignments,
  weeksCount,
  periodDays,
  onAssignmentsChange,
}: {
  planId: string;
  assignments: Assignment[];
  weeksCount: number;
  periodDays: number;
  onAssignmentsChange: (next: Assignment[]) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);

  const active = useMemo(
    () => assignments.filter((a) => a.status === "active" || a.status === "paused"),
    [assignments],
  );

  async function patchAssignment(
    assignmentId: string,
    patch: Partial<Pick<Assignment, "status" | "startDate">>,
  ) {
    setSavingId(assignmentId);
    try {
      const res = await api.patch<{ id: string; status: Assignment["status"]; startDate: string | null }>(
        `/coach/plans/${planId}/assignments/${assignmentId}`,
        patch,
      );
      onAssignmentsChange(
        assignments.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                status: res.status,
                startDate: res.startDate,
                currentWeekNumber: computeCurrentWeekNumber(res.startDate, periodDays, weeksCount),
              }
            : a,
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la asignación");
    } finally {
      setSavingId(null);
    }
  }

  if (active.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>
            Asignaciones
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 3 }}>
            {active.length} alumno{active.length !== 1 ? "s" : ""} con este plan
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-mute)", fontSize: 12 }}>
          <Icon name="calendar" size={14} color="var(--text-mute)" />
          <span className="ta-mono">{weeksCount} semanas</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {active.map((a) => (
          <div
            key={a.id}
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{displayName(a.client)}</div>
                <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                <Badge tone="neutral">Semana {a.currentWeekNumber}/{weeksCount}</Badge>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4 }}>{a.client.email}</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>
                  Inicio del plan
                </div>
                <input
                  type="date"
                  value={a.startDate ?? ""}
                  onChange={(e) => patchAssignment(a.id, { startDate: e.target.value || null })}
                  disabled={savingId === a.id}
                  style={{
                    height: 34,
                    background: "var(--bg-1)",
                    border: "1px solid var(--line-2)",
                    borderRadius: 10,
                    padding: "0 10px",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {a.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === a.id}
                    onClick={() => patchAssignment(a.id, { status: "paused" })}
                    title="Pausar plan para este alumno"
                    ariaLabel="Pausar plan"
                  >
                    Pausar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingId === a.id}
                    onClick={() => patchAssignment(a.id, { status: "active" })}
                    title="Reactivar plan para este alumno"
                    ariaLabel="Reactivar plan"
                  >
                    Reactivar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingId === a.id}
                  onClick={() => patchAssignment(a.id, { status: "finished" })}
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                  title="Finalizar plan para este alumno"
                  ariaLabel="Finalizar plan"
                >
                  Finalizar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
