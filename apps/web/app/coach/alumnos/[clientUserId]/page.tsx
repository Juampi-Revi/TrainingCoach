"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, ConfirmModal, StateBlock, Tabs } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { useClientDetail } from "./_hooks/use-client-detail";
import { useTabData } from "./_hooks/use-tab-data";
import { useOverviewData } from "./_hooks/use-overview-data";
import { useProgressData } from "./_hooks/use-progress-data";
import { AssignPlanModal } from "./_components/assign-plan-modal";
import { ClientHeader } from "./_components/client-header";
import { OverviewTab } from "./_components/overview-tab";
import { SessionsList } from "./_components/sessions-list";
import { HealthTab } from "./_components/health-tab";
import { FoodTab } from "./_components/food-tab";
import { GoalsTab } from "./_components/goals-tab";
import { MetricsTab } from "./_components/metrics-tab";
import { ProgressTab } from "./_components/progress-tab";
import { RightSidebar } from "./_components/right-sidebar";

const TABS = ["Resumen", "Entrenos", "Actividad", "Progreso", "Privado"] as const;

export default function AthleteDetailPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { clientUserId } = useParams<{ clientUserId: string }>();

  const { client, loading, setClient } = useClientDetail(clientUserId);

  const tabData = useTabData(clientUserId);
  const overview = useOverviewData(clientUserId);
  const progressData = useProgressData(clientUserId);

  const [tab, setTab] = useState("Resumen");
  const [showAssign, setShowAssign] = useState(false);
  const [removingPlan, setRemovingPlan] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    overview.load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabChange(next: string) {
    setTab(next);
    if (next === "Resumen") {
      overview.load(false);
    }
    if (next === "Actividad") {
      tabData.loadHealthData(false);
      tabData.loadFoodData(false);
    }
    if (next === "Privado") {
      tabData.loadGoalsData(false);
      tabData.loadHealthData(false);
    }
    if (next === "Progreso") {
      progressData.load(false);
    }
  }

  if (loading) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="loading" title="Cargando alumno…" />
      </DesktopShell>
    );
  }

  if (!client) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="error" title="Alumno no encontrado" />
      </DesktopShell>
    );
  }

  const name = client.name ?? client.email;

  return (
    <>
      <DesktopShell
        active="athletes"
        title={
          <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
            Alumnos{" "}
            <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{name}</span>
          </span>
        }
        subtitle={`${client.email}${client.assignment?.plan ? ` · ${client.assignment.plan.title}` : ""}`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/alumnos")}>
              Volver
            </Button>
            <Button variant="outline" size="sm" icon="msg" onClick={() => router.push(`/coach/mensajes/${clientUserId}`)}>
              Mensaje
            </Button>
            <Button variant="outline" size="sm" icon="calendar" onClick={() => setShowAssign(true)}>
              {client.assignment?.plan ? "Cambiar plan" : "Asignar plan"}
            </Button>
            {client.assignment?.plan && (
              <Button variant="outline" size="sm" icon="edit" onClick={() => router.push(`/coach/planes/${client.assignment!.plan!.id}`)}>
                Ver plan
              </Button>
            )}
            {client.assignment?.plan && (
              <Button
                variant="outline"
                size="sm"
                disabled={removingPlan}
                onClick={() => setConfirmDialog({
                  message: "¿Quitar el plan activo de este alumno?",
                  onConfirm: async () => {
                    setConfirmDialog(null);
                    setRemovingPlan(true);
                    try {
                      await api.patch(`/coach/clients/${clientUserId}`, { planStatus: "finished" });
                      setClient((prev) => prev ? { ...prev, assignment: null } : prev);
                      toast.success("Plan quitado");
                    } catch {
                      toast.error("No se pudo quitar el plan");
                      setRemovingPlan(false);
                    }
                  },
                })}
                style={{ color: "var(--warn)", borderColor: "var(--warn)" }}
              >
                {removingPlan ? "Quitando…" : "Quitar plan"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={unlinking}
              onClick={() => setConfirmDialog({
                message: `¿Desvincular a ${client.name ?? client.email}? Perderás acceso a sus datos.`,
                onConfirm: async () => {
                  setConfirmDialog(null);
                  setUnlinking(true);
                  try {
                    await api.del(`/coach/clients/${clientUserId}`);
                    router.replace("/coach/alumnos");
                  } catch {
                    setUnlinking(false);
                  }
                },
              })}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
            >
              {unlinking ? "Desvinculando…" : "Desvincular"}
            </Button>
          </>
        }
      >
        <div className="coach-pad" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <ClientHeader client={client} />

          <div style={{ display: "flex", gap: 20, padding: "18px 0 0" }}>
            <Tabs tabs={[...TABS]} active={tab} onChange={handleTabChange} />
          </div>

          <div className="coach-two-col" style={{ padding: "18px 0 28px" }}>
            {tab === "Resumen" && (
              <OverviewTab
                client={client}
                clientUserId={clientUserId}
                today={overview.today}
                week={overview.week}
                month={overview.month}
                loading={overview.loading}
                onViewTraining={() => handleTabChange("Entrenos")}
              />
            )}
            {tab === "Entrenos" && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Entrenos recientes</div>
                <SessionsList sessions={client.recentSessions ?? []} clientUserId={clientUserId} showStatus />
              </div>
            )}
            {tab === "Actividad" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <HealthTab health={tabData.health} healthLoading={tabData.healthLoading} onSelectDay={tabData.setNoteDay} />
                <FoodTab
                  food={tabData.food}
                  foodLoading={tabData.foodLoading}
                  foodCommentDrafts={tabData.foodCommentDrafts}
                  onDraftChange={(id, val) => tabData.setFoodCommentDrafts((prev) => ({ ...prev, [id]: val }))}
                  onPostComment={tabData.postFoodComment}
                  onReload={() => tabData.loadFoodData(true)}
                />
              </div>
            )}
            {tab === "Progreso" && (
              <ProgressTab progress={progressData.progress} loading={progressData.loading} />
            )}
            {tab === "Privado" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <GoalsTab
                  goals={tabData.goals}
                  shared={tabData.goalsShared}
                  goalsLoading={tabData.goalsLoading}
                  goalKind={tabData.goalKind}
                  setGoalKind={tabData.setGoalKind}
                  goalTarget={tabData.goalTarget}
                  setGoalTarget={tabData.setGoalTarget}
                  onAdd={tabData.addGoal}
                  onDelete={tabData.deleteGoal}
                  onReload={() => tabData.loadGoalsData(true)}
                />
                <MetricsTab health={tabData.health} healthLoading={tabData.healthLoading} />
              </div>
            )}

            <RightSidebar
              client={client}
              tab={tab}
              noteDay={tabData.noteDay}
              setNoteDay={tabData.setNoteDay}
              noteText={tabData.noteText}
              setNoteText={tabData.setNoteText}
              savingNote={tabData.savingNote}
              onSaveNote={tabData.saveCoachNote}
              notesForDay={tabData.notesForDay}
            />
          </div>
        </div>
      </DesktopShell>

      {showAssign && (
        <AssignPlanModal
          clientUserId={clientUserId}
          currentPlanId={client.assignment?.plan?.id}
          onClose={() => setShowAssign(false)}
          onAssigned={(planId, planTitle, weeksCount) => {
            setClient((prev) => prev ? {
              ...prev,
              assignment: { status: "active", plan: { id: planId, title: planTitle, weeksCount } },
            } : prev);
            toast.success(`Plan "${planTitle}" asignado`);
          }}
        />
      )}
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
