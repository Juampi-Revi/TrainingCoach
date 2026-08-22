"use client";

import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, ConfirmModal, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { TemplatePicker } from "./_components/template-picker";
import { PlanProperties } from "./_components/plan-properties";
import { PlanGrid } from "./_components/plan-grid";
import { PlanAssignments } from "./_components/plan-assignments";
import { PlanProgressionNoteModal } from "./_components/plan-progression-note-modal";
import { usePlanEditor } from "./_hooks/use-plan-editor";

export default function PlanDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { planId } = useParams<{ planId: string }>();

  const editor = usePlanEditor(planId);
  const { state } = editor;
  const { plan, loading } = state;

  if (loading) return <DesktopShell active="plans" coachName={user?.name ?? "Coach"}><StateBlock kind="loading" title="Cargando plan…" /></DesktopShell>;
  if (!plan)  return <DesktopShell active="plans" coachName={user?.name ?? "Coach"}><StateBlock kind="error" title="Plan no encontrado" /></DesktopShell>;

  const cols = plan.periodDays ?? 7;

  return (
    <>
      <DesktopShell
        active="plans"
        title={
          <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
            Planes <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{state.planTitle || plan.title}</span>
          </span>
        }
        subtitle={`${plan.periodDays} días/sem · ${state.planWeeks || plan.weeksCount} semanas · ${plan.assignments?.length ?? 0} alumnos`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <span
              className="ta-mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".06em",
                color:
                  state.saveStatus === "error"
                    ? "var(--danger)"
                    : state.saveStatus === "saving"
                      ? "var(--text-mute)"
                      : state.saveStatus === "saved"
                        ? "var(--lime)"
                        : "var(--text-dim)",
                minWidth: 88,
                textAlign: "right",
              }}
            >
              {state.saveStatus === "saving"
                ? "Guardando…"
                : state.saveStatus === "saved"
                  ? "Guardado ✓"
                  : state.saveStatus === "error"
                    ? "Error al guardar"
                    : "Autoguardado"}
            </span>
            <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/planes")}>
              Planes
            </Button>
            <Button variant="outline" size="sm" icon="eye" onClick={() => router.push(`/coach/planes/${planId}/preview`)}>
              Vista alumno
            </Button>
            <Button variant="outline" size="sm" icon="repeat" disabled={state.duplicating} onClick={() => editor.handleDuplicate((id) => router.push(`/coach/planes/${id}`))}>
              {state.duplicating ? "Duplicando…" : "Duplicar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={state.publishing}
              onClick={editor.togglePublish}
              style={plan.status === "published" ? { color: "var(--lime)", borderColor: "var(--lime)" } : {}}
            >
              {plan.status === "published" ? "✓ Publicado" : "Publicar"}
            </Button>
            <Button variant="outline" size="sm" disabled={state.deleting} onClick={() => editor.handleDelete(() => router.replace("/coach/planes"))}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
              {state.deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </>
        }
      >
        <div className="coach-pad">
          <PlanAssignments
            planId={planId}
            assignments={plan.assignments}
            weeksCount={plan.weeksCount}
            periodDays={plan.periodDays}
            onAssignmentsChange={(next) => editor.patch("plan", { ...plan, assignments: next })}
          />

          <PlanProperties
            planStatus={plan.status}
            planTitle={state.planTitle}
            setPlanTitle={(v) => editor.patch("planTitle", v)}
            planGoal={state.planGoal}
            setPlanGoal={(v) => editor.patch("planGoal", v)}
            planNotes={state.planNotes}
            setPlanNotes={(v) => editor.patch("planNotes", v)}
            planWeeks={state.planWeeks}
            setPlanWeeks={(v) => editor.patch("planWeeks", v)}
            onSavePlanField={editor.savePlanField}
          />

          <PlanGrid
            cols={cols}
            weeksCount={plan.weeksCount}
            grid={state.grid}
            weekMeta={state.weekMeta}
            expandedWeek={state.expandedWeek}
            onToggleWeekExpand={(wn) => editor.patch("expandedWeek", state.expandedWeek === wn ? null : wn)}
            onWeekMetaChange={(wn, patch) =>
              editor.patch("weekMeta", {
                ...state.weekMeta,
                [wn]: { ...(state.weekMeta[wn] ?? { title: "", notes: "" }), ...patch },
              })
            }
            onWeekMetaBlur={editor.saveWeekMeta}
            cellMenu={state.cellMenu}
            onCellMenuToggle={(coords) =>
              editor.patch("cellMenu", state.cellMenu?.week === coords.week && state.cellMenu.day === coords.day ? null : coords)
            }
            onCellMenuClose={() => editor.patch("cellMenu", null)}
            onEmptyCellClick={(wi, di) => editor.patch("picker", { week: wi, day: di })}
            onCellChangeWorkout={(wi, di) => editor.patch("picker", { week: wi, day: di })}
            onCellEditProgressionNote={editor.handleEditProgressionNote}
            onCellClear={editor.handleCellClear}
            onViewWorkout={(templateId) => router.push(`/coach/workouts/${templateId}`)}
            onOpenLibrary={(templateId) =>
              router.push(`/coach/ejercicios?templateId=${encodeURIComponent(templateId)}&context=plan&returnTo=${encodeURIComponent(`/coach/planes/${planId}`)}`)
            }
            onMoveCell={editor.handleMoveCell}
            canPasteWeek={!!state.weekClipboard}
            onCopyWeek={editor.copyWeek}
            onPasteWeek={editor.pasteWeek}
            onClearWeek={editor.clearWeek}
            onDuplicateWeek={editor.duplicateWeek}
          />
        </div>
      </DesktopShell>

      {state.picker && (
        <TemplatePicker
          onSelect={editor.handleCellSelect}
          onClose={() => editor.patch("picker", null)}
        />
      )}
      {state.confirmDialog && (
        <ConfirmModal
          message={state.confirmDialog.message}
          onConfirm={state.confirmDialog.onConfirm}
          onCancel={() => editor.patch("confirmDialog", null)}
        />
      )}
      <PlanProgressionNoteModal
        open={!!state.noteEditor}
        workoutTitle={state.noteEditor?.title ?? ""}
        value={state.noteEditor?.value ?? ""}
        saving={state.noteSaving}
        onChange={(val) => editor.patch("noteEditor", state.noteEditor ? { ...state.noteEditor, value: val } : null)}
        onClose={() => {
          if (state.noteSaving) return;
          editor.patch("noteEditor", null);
        }}
        onSave={editor.saveProgressionNote}
      />
    </>
  );
}
