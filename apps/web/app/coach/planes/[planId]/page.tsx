"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, ConfirmModal, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { CellData, PlanDetail, TemplateSummary, WeekMetaState } from "./_components/types";
import { TemplatePicker } from "./_components/template-picker";
import { PlanProperties } from "./_components/plan-properties";
import { PlanGrid } from "./_components/plan-grid";
import { PlanAssignments } from "./_components/plan-assignments";
import { PlanProgressionNoteModal } from "./_components/plan-progression-note-modal";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanDetailPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [grid, setGrid] = useState<Array<Array<CellData | null>>>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [picker, setPicker] = useState<{ week: number; day: number } | null>(null);
  const [cellMenu, setCellMenu] = useState<{ week: number; day: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planGoal, setPlanGoal] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [planWeeks, setPlanWeeks] = useState<string>("");
  const [weekMeta, setWeekMeta] = useState<WeekMetaState>({});
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [weekClipboard, setWeekClipboard] = useState<Array<CellData | null> | null>(null);
  const [noteEditor, setNoteEditor] = useState<{ week: number; day: number; pwwId: string; title: string; value: string } | null>(null);
  const [noteSaving, setNoteSaving] = useState(false);

  const load = useCallback(() => {
    api.get<PlanDetail>(`/coach/plans/${planId}`)
      .then((p) => {
        setPlan(p);
        setPlanTitle(p.title);
        setPlanGoal(p.goal ?? "");
        setPlanNotes(p.notes ?? "");
        setPlanWeeks(String(p.weeksCount));
        const meta: Record<number, { title: string; notes: string }> = {};
        p.weeks.forEach((w) => { meta[w.weekNumber] = { title: w.title ?? "", notes: w.notes ?? "" }; });
        setWeekMeta(meta);
        const cols = p.periodDays ?? 7;
        const g: Array<Array<CellData | null>> = Array.from({ length: p.weeksCount }, (_, wi) => {
          const week = p.weeks?.find((w) => w.weekNumber === wi + 1);
          return Array.from({ length: cols }, (_, di) => {
            const pw = week?.workouts.find((w) => w.sortOrder === di);
            if (!pw) return null;
            return { pwwId: pw.id, templateId: pw.workoutTemplate.id, title: pw.workoutTemplate.title, tags: pw.workoutTemplate.tags, exerciseCount: pw.workoutTemplate.exerciseCount, progressionNote: pw.progressionNote ?? null };
          });
        });
        setGrid(g);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, planId]);

  useEffect(() => { load(); }, [load]);

  async function savePlanField(field: Record<string, unknown>) {
    try {
      await api.patch(`/coach/plans/${planId}`, field);
    } catch (e) { console.error(e); }
  }

  async function saveWeekMeta(weekNumber: number) {
    const meta = weekMeta[weekNumber] ?? { title: "", notes: "" };
    try {
      await api.patch(`/coach/plans/${planId}/weeks/${weekNumber}`, {
        title: meta.title || null,
        notes: meta.notes || null,
      });
    } catch (e) { console.error(e); }
  }

  async function togglePublish() {
    if (!plan) return;
    setPublishing(true);
    const next = plan.status === "published" ? "draft" : "published";
    try {
      await api.patch(`/coach/plans/${planId}`, { status: next });
      setPlan((p) => p ? { ...p, status: next } : p);
      toast.success(next === "published" ? "Plan publicado" : "Plan vuelto a borrador");
    } catch (e) { console.error(e); toast.error("No se pudo actualizar el plan"); }
    finally { setPublishing(false); }
  }

  function handleDelete() {
    if (!plan) return;
    setConfirmDialog({
      message: `¿Eliminar el plan "${plan.title}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeleting(true);
        try {
          await api.del(`/coach/plans/${planId}`);
          toast.success("Plan eliminado");
          router.replace("/coach/planes");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al eliminar");
          setDeleting(false);
        }
      },
    });
  }

  function handleDuplicate() {
    if (!plan) return;
    setConfirmDialog({
      message: `¿Duplicar el plan "${plan.title}"? Se creará una copia en borrador.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDuplicating(true);
        try {
          const res = await api.post<{ id: string }>(`/coach/plans/${planId}/duplicate`, {});
          toast.success("Plan duplicado");
          router.push(`/coach/planes/${res.id}`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No se pudo duplicar el plan");
        } finally {
          setDuplicating(false);
        }
      },
    });
  }

  async function handleMoveCell(fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) {
    if (fromWeekIndex === toWeekIndex && fromDayIndex === toDayIndex) return;
    const from = grid[fromWeekIndex]?.[fromDayIndex] ?? null;
    if (!from) return;

    setCellMenu(null);

    setGrid((prev) => {
      const next = prev.map((row) => row.slice());
      const a = next[fromWeekIndex]?.[fromDayIndex] ?? null;
      const b = next[toWeekIndex]?.[toDayIndex] ?? null;
      if (!a) return prev;
      next[toWeekIndex][toDayIndex] = a;
      next[fromWeekIndex][fromDayIndex] = b;
      return next;
    });

    try {
      await api.put(`/coach/plans/${planId}/move`, {
        fromWeekNumber: fromWeekIndex + 1,
        fromSortOrder: fromDayIndex,
        toWeekNumber: toWeekIndex + 1,
        toSortOrder: toDayIndex,
      });
    } catch (e) {
      console.error(e);
      load();
    }
  }

  async function handleCellSelect(template: TemplateSummary) {
    if (!picker) return;
    const { week, day } = picker;
    setPicker(null);
    const cell: CellData = { pwwId: "", templateId: template.id, title: template.title, tags: template.tags, exerciseCount: template.exerciseCount, progressionNote: null };
    // Optimistic update
    setGrid((prev) => prev.map((row, wi) => wi === week ? row.map((c, di) => di === day ? cell : c) : row));
    try {
      const res = await api.put<{ pwwId: string }>(`/coach/plans/${planId}/cell`, { weekNumber: week + 1, sortOrder: day, workoutTemplateId: template.id });
      setGrid((prev) => prev.map((row, wi) => wi === week ? row.map((c, di) => di === day ? { ...cell, pwwId: res.pwwId } : c) : row));
    } catch (e) {
      console.error(e);
      load(); // revert on error
    }
  }

  async function handleCellClear(week: number, day: number) {
    setCellMenu(null);
    setGrid((prev) => prev.map((row, wi) => wi === week ? row.map((c, di) => di === day ? null : c) : row));
    try {
      await api.del(`/coach/plans/${planId}/cell`, { weekNumber: week + 1, sortOrder: day });
    } catch (e) {
      console.error(e);
      load();
    }
  }

  function handleEditProgressionNote(weekIndex: number, dayIndex: number) {
    const cell = grid[weekIndex]?.[dayIndex] ?? null;
    if (!cell?.pwwId) return;
    setNoteEditor({
      week: weekIndex,
      day: dayIndex,
      pwwId: cell.pwwId,
      title: cell.title,
      value: cell.progressionNote ?? "",
    });
  }

  async function saveProgressionNote() {
    if (!noteEditor) return;
    const trimmed = noteEditor.value.trim();
    setNoteSaving(true);
    try {
      const res = await api.patch<{ pwwId: string; progressionNote: string | null }>(`/coach/plans/${planId}/cell`, {
        pwwId: noteEditor.pwwId,
        progressionNote: trimmed ? trimmed : null,
      });
      setGrid((prev) =>
        prev.map((row, wi) =>
          wi === noteEditor.week
            ? row.map((c, di) => (di === noteEditor.day && c ? { ...c, progressionNote: res.progressionNote } : c))
            : row,
        ),
      );
      toast.success("Nota guardada");
      setNoteEditor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
    } finally {
      setNoteSaving(false);
    }
  }

  function copyWeek(weekNumber: number) {
    const row = grid[weekNumber - 1] ?? [];
    const cloned = row.map((c) => (c ? { ...c, pwwId: "" } : null));
    setWeekClipboard(cloned);
    toast.success(`Semana ${weekNumber} copiada`);
  }

  async function applyWeekReplace(weekNumber: number, sourceRow: Array<CellData | null>) {
    const targetRow = sourceRow.map((c) => (c ? { ...c, pwwId: "" } : null));
    setGrid((prev) => prev.map((row, wi) => (wi === weekNumber - 1 ? targetRow : row)));

    const items = targetRow.flatMap((cell, sortOrder) =>
      cell ? [{ sortOrder, workoutTemplateId: cell.templateId, progressionNote: cell.progressionNote ?? null }] : [],
    );

    try {
      await api.put(`/coach/plans/${planId}/weeks/${weekNumber}/workouts`, { items });
      toast.success(`Semana ${weekNumber} actualizada`);
      load();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la semana");
      load();
    }
  }

  async function pasteWeek(weekNumber: number) {
    if (!weekClipboard) return;
    await applyWeekReplace(weekNumber, weekClipboard);
  }

  function clearWeek(weekNumber: number) {
    setConfirmDialog({
      message: `¿Vaciar la semana ${weekNumber}? Se quitarán todos los entrenos.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setGrid((prev) => prev.map((row, wi) => (wi === weekNumber - 1 ? row.map(() => null) : row)));
        try {
          await api.del(`/coach/plans/${planId}/weeks/${weekNumber}/workouts`);
          toast.success(`Semana ${weekNumber} vaciada`);
          load();
        } catch (e) {
          console.error(e);
          toast.error("No se pudo vaciar la semana");
          load();
        }
      },
    });
  }

  async function duplicateWeek(fromWeekNumber: number, toWeekNumber: number) {
    const row = grid[fromWeekNumber - 1] ?? [];
    const cloned = row.map((c) => (c ? { ...c, pwwId: "" } : null));
    setWeekClipboard(cloned);
    await applyWeekReplace(toWeekNumber, cloned);
  }

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
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{planTitle || plan.title}</span>
          </span>
        }
        subtitle={`${plan.periodDays} días/sem · ${planWeeks || plan.weeksCount} semanas · ${plan.assignments?.length ?? 0} alumnos`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/planes")}>
              Planes
            </Button>
            <Button variant="outline" size="sm" icon="eye" onClick={() => router.push(`/coach/planes/${planId}/preview`)}>
              Vista alumno
            </Button>
            <Button variant="outline" size="sm" icon="repeat" disabled={duplicating} onClick={handleDuplicate}>
              {duplicating ? "Duplicando…" : "Duplicar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={publishing}
              onClick={togglePublish}
              style={plan.status === "published" ? { color: "var(--lime)", borderColor: "var(--lime)" } : {}}
            >
              {plan.status === "published" ? "✓ Publicado" : "Publicar"}
            </Button>
            <Button variant="outline" size="sm" disabled={deleting} onClick={handleDelete}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
              {deleting ? "Eliminando…" : "Eliminar"}
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
            onAssignmentsChange={(next) => setPlan((p) => (p ? { ...p, assignments: next } : p))}
          />

          <PlanProperties
            planStatus={plan.status}
            planTitle={planTitle}
            setPlanTitle={setPlanTitle}
            planGoal={planGoal}
            setPlanGoal={setPlanGoal}
            planNotes={planNotes}
            setPlanNotes={setPlanNotes}
            planWeeks={planWeeks}
            setPlanWeeks={setPlanWeeks}
            onSavePlanField={savePlanField}
          />

          <PlanGrid
            cols={cols}
            weeksCount={plan.weeksCount}
            grid={grid}
            weekMeta={weekMeta}
            expandedWeek={expandedWeek}
            onToggleWeekExpand={(weekNumber) => setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber)}
            onWeekMetaChange={(weekNumber, patch) =>
              setWeekMeta((m) => ({
                ...m,
                [weekNumber]: { ...(m[weekNumber] ?? { title: "", notes: "" }), ...patch },
              }))
            }
            onWeekMetaBlur={saveWeekMeta}
            cellMenu={cellMenu}
            onCellMenuToggle={(coords) =>
              setCellMenu((prev) => (prev?.week === coords.week && prev.day === coords.day ? null : coords))
            }
            onCellMenuClose={() => setCellMenu(null)}
            onEmptyCellClick={(weekIndex, dayIndex) => setPicker({ week: weekIndex, day: dayIndex })}
            onCellChangeWorkout={(weekIndex, dayIndex) => setPicker({ week: weekIndex, day: dayIndex })}
            onCellEditProgressionNote={handleEditProgressionNote}
            onCellClear={handleCellClear}
            onViewWorkout={(templateId) => router.push(`/coach/workouts/${templateId}`)}
            onMoveCell={handleMoveCell}
            canPasteWeek={!!weekClipboard}
            onCopyWeek={copyWeek}
            onPasteWeek={pasteWeek}
            onClearWeek={clearWeek}
            onDuplicateWeek={duplicateWeek}
          />
        </div>
      </DesktopShell>

      {picker && (
        <TemplatePicker
          onSelect={handleCellSelect}
          onClose={() => setPicker(null)}
        />
      )}
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      <PlanProgressionNoteModal
        open={!!noteEditor}
        workoutTitle={noteEditor?.title ?? ""}
        value={noteEditor?.value ?? ""}
        saving={noteSaving}
        onChange={(val) => setNoteEditor((cur) => (cur ? { ...cur, value: val } : cur))}
        onClose={() => {
          if (noteSaving) return;
          setNoteEditor(null);
        }}
        onSave={saveProgressionNote}
      />
    </>
  );
}
