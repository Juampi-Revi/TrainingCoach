"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Badge, Button, ConfirmModal, Icon, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { PlanSummary } from "@regen/types";

const AVATAR_TONES = ["#7AB8FF", "#FFB547", "#FF5B5B"];

export default function PlanesPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    api
      .get<PlanSummary[]>("/coach/plans")
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  function deletePlan(e: React.MouseEvent, planId: string, planTitle: string) {
    e.stopPropagation();
    setConfirmDialog({
      message: `¿Eliminar "${planTitle}"? No se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeletingId(planId);
        try {
          await api.del(`/coach/plans/${planId}`);
          setPlans((prev) => prev.filter((p) => p.id !== planId));
          toast.success("Plan eliminado");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo eliminar el plan");
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  async function createPlan() {
    setCreating(true);
    try {
      const p = await api.post<{ id: string }>("/coach/plans", {
        title: "Nuevo plan",
        weeksCount: 8,
        periodDays: 7,
      });
      router.push(`/coach/planes/${p.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  return (
    <>
    <DesktopShell
      active="plans"
      title="Planes"
      subtitle={`${plans.length} planes`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button size="sm" icon="plus" disabled={creating} onClick={createPlan}>
            {creating ? "Creando…" : "Nuevo plan"}
          </Button>
        </>
      }
    >
      <div className="coach-pad">
        {loading ? (
          <StateBlock kind="loading" title="Cargando planes…" />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/coach/planes/${p.id}`)}
                style={{
                  padding: 18,
                  background: "var(--bg-1)",
                  border: `1px solid ${p.status === "published" ? "var(--lime)" : "var(--line)"}`,
                  borderRadius: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  cursor: "pointer",
                  opacity: p.status === "draft" ? 0.65 : 1,
                }}
                className="ta-row"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.goal && (
                      <Badge tone={p.status === "published" ? "lime" : "neutral"}>
                        {p.goal}
                      </Badge>
                    )}
                    {p.status === "draft" && <Badge tone="neutral">Borrador</Badge>}
                  </div>
                  <button
                    onClick={(e) => deletePlan(e, p.id, p.title)}
                    disabled={deletingId === p.id}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: deletingId === p.id ? 0.4 : 1, display: "flex", alignItems: "center" }}
                    title="Eliminar plan"
                  >
                    <Icon name="trash" size={14} color="var(--text-mute)" />
                  </button>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: "-.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    className="ta-mono"
                    style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}
                  >
                    {p.periodDays} días/sem · {p.weeksCount} semanas
                  </div>
                </div>

                {/* Progress bar (weeks) */}
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: Math.min(p.weeksCount, 12) }).map((_, wi) => (
                    <div
                      key={wi}
                      style={{
                        flex: 1,
                        height: 18,
                        background: wi < 3 ? "var(--lime)" : "var(--bg-3)",
                        borderRadius: 3,
                        opacity: wi < 3 ? 1 : 0.6,
                      }}
                    />
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {p.assignedCount > 0 ? (
                      <>
                        <div style={{ display: "flex" }}>
                          {AVATAR_TONES.slice(0, Math.min(3, p.assignedCount)).map(
                            (tone, ai) => (
                              <div
                                key={ai}
                                style={{ marginLeft: ai === 0 ? 0 : -6 }}
                              >
                                <Avatar name={`A${ai}`} size={22} tone={tone} />
                              </div>
                            )
                          )}
                        </div>
                        <span
                          className="ta-mono"
                          style={{ fontSize: 11, color: "var(--text-mute)" }}
                        >
                          {p.assignedCount} asignado{p.assignedCount !== 1 ? "s" : ""}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        Sin asignar
                      </span>
                    )}
                  </div>
                  <Icon name="chevR" size={14} color="var(--text-mute)" />
                </div>
              </div>
            ))}

            {/* New plan slot */}
            <div
              onClick={createPlan}
              style={{
                padding: 18,
                borderRadius: 14,
                border: "1px dashed var(--line-2)",
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 220,
                color: "var(--text-mute)",
                cursor: "pointer",
              }}
              className="ta-row"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--bg-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="plus" size={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Crear plan</div>
              <div style={{ fontSize: 11 }}>Desde cero</div>
            </div>
          </div>
        )}
      </div>
    </DesktopShell>
    {confirmDialog && (
      <ConfirmModal
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    )}
    </>
  );
}
