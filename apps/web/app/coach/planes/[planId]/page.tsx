"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Icon, StateBlock, Tabs } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

interface PlanDetail {
  id: string;
  title: string;
  goal: string | null;
  status: string;
  weeksCount: number;
  periodDays: number;
  notes: string | null;
  weeks: Array<{
    weekNumber: number;
    workouts: Array<{
      id: string;
      sortOrder: number;
      workoutTemplate: { id: string; title: string } | null;
    }>;
  }>;
  assignments: Array<{ id: string; client: { id: string; name: string | null; email: string } }>;
}


const PHASE_COLORS = {
  accum: { bg: "rgba(215,255,58,.1)", b: "rgba(215,255,58,.3)", t: "var(--lime)" },
  intens: { bg: "rgba(255,181,71,.1)", b: "rgba(255,181,71,.3)", t: "var(--warn)" },
  deload: { bg: "var(--bg-2)", b: "var(--line-2)", t: "var(--text-mute)" },
  test: { bg: "rgba(122,184,255,.1)", b: "rgba(122,184,255,.3)", t: "var(--info)" },
} as const;

function getPhase(wi: number, total: number): keyof typeof PHASE_COLORS {
  const pct = wi / total;
  if (pct >= 0.875) return "test";
  if (pct >= 0.75) return "deload";
  if (pct >= 0.375) return "intens";
  return "accum";
}

export default function PlanDetailPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("Semanas");

  useEffect(() => {
    api
      .get<PlanDetail>(`/coach/plans/${planId}`)
      .then(setPlan)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, planId]);

  if (loading) {
    return (
      <DesktopShell active="plans" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="loading" title="Cargando plan…" />
      </DesktopShell>
    );
  }

  if (!plan) {
    return (
      <DesktopShell active="plans" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="error" title="Plan no encontrado" />
      </DesktopShell>
    );
  }

  const cols = plan.periodDays ?? 7;
  // Build a week×slot grid using sortOrder as column index (0-based)
  const grid: Array<Array<string | null>> = Array.from(
    { length: plan.weeksCount },
    (_, wi) => {
      const week = plan.weeks?.find((w) => w.weekNumber === wi + 1);
      return Array.from({ length: cols }, (_, di) => {
        const workout = week?.workouts.find((w) => w.sortOrder === di);
        return workout?.workoutTemplate?.title ?? null;
      });
    }
  );

  return (
    <DesktopShell
      active="plans"
      title={
        <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
          Planes <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>{plan.title}</span>
        </span>
      }
      subtitle={`${plan.periodDays} días/sem · ${plan.weeksCount} semanas · ${plan.assignments?.length ?? 0} alumnos asignados`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            icon="chevL"
            onClick={() => router.push("/coach/planes")}
          >
            Planes
          </Button>
          <Button size="sm" icon="edit" onClick={() => {}}>
            Editar
          </Button>
        </>
      }
    >
      <div style={{ padding: 28 }}>
        {/* Legend + view toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
            fontSize: 11,
            color: "var(--text-mute)",
          }}
        >
          {Object.entries({
            accum: "Acumulación",
            intens: "Intensificación",
            deload: "Deload",
            test: "Test",
          }).map(([key, label]) => {
            const c = PHASE_COLORS[key as keyof typeof PHASE_COLORS];
            return (
              <div
                key={key}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: c.t,
                    opacity: 0.8,
                  }}
                />
                {label}
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <Tabs
            variant="pills"
            tabs={["Semanas", "Volumen"]}
            active={viewMode}
            onChange={setViewMode}
          />
        </div>

        {/* Grid header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `80px repeat(${cols}, 1fr)`,
            gap: 6,
            marginBottom: 6,
          }}
        >
          <div />
          {Array.from({ length: cols }, (_, i) => (
            <div
              key={i}
              className="ta-mono"
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                fontWeight: 600,
                padding: "6px 0",
              }}
            >
              D{i + 1}
            </div>
          ))}
        </div>

        {/* Weeks grid */}
        {grid.map((week, wi) => {
          const phase = getPhase(wi, plan.weeksCount);
          const phaseLabel =
            phase === "accum"
              ? "Acum."
              : phase === "intens"
              ? "Intens."
              : phase === "deload"
              ? "Deload"
              : "Test";

          return (
            <div
              key={wi}
              style={{
                display: "grid",
                gridTemplateColumns: `80px repeat(${cols}, 1fr)`,
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span
                  className="ta-mono"
                  style={{ color: "var(--text-mute)", fontSize: 10 }}
                >
                  S{wi + 1}
                </span>
                <span style={{ fontSize: 11 }}>{phaseLabel}</span>
              </div>
              {week.map((w, di) => {
                if (!w) {
                  return (
                    <div
                      key={di}
                      style={{
                        height: 50,
                        background: "var(--bg)",
                        border: "1px dashed var(--line)",
                        borderRadius: 8,
                      }}
                    />
                  );
                }
                const colors = PHASE_COLORS[phase];
                return (
                  <div
                    key={di}
                    style={{
                      height: 50,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: colors.bg,
                      border: `1px solid ${colors.b}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{w}</div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {grid.every((row) => row.every((c) => c === null)) && (
          <div
            style={{
              padding: "32px 0",
              textAlign: "center",
              color: "var(--text-mute)",
              fontSize: 13,
            }}
          >
            Este plan no tiene workouts asignados aún. Editalo para agregarlos.
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
