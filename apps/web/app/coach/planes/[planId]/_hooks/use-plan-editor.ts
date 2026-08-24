import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { CellData, PlanDetail, TemplateSummary, WeekMetaState } from "../_components/types";
import {
  clonePlanGrid,
  usePlanGridHistory,
  weekItemsFromRow,
} from "./use-plan-grid-history";

interface PlanEditorState {
  plan: PlanDetail | null;
  grid: Array<Array<CellData | null>>;
  loading: boolean;
  publishing: boolean;
  deleting: boolean;
  duplicating: boolean;
  planTitle: string;
  planGoal: string;
  planNotes: string;
  planWeeks: string;
  weekMeta: WeekMetaState;
  expandedWeek: number | null;
  weekClipboard: Array<CellData | null> | null;
  picker: { week: number; day: number } | null;
  cellMenu: { week: number; day: number } | null;
  confirmDialog: { message: string; onConfirm: () => void } | null;
  noteEditor: { week: number; day: number; pwwId: string; title: string; value: string } | null;
  noteSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
}

export function usePlanEditor(planId: string) {
  const { api } = useAuth();
  const toast = useToast();
  const {
    capture: captureGrid,
    undo: undoGrid,
    redo: redoGrid,
    clear: clearGridHistory,
    canUndo,
    canRedo,
    busy: historyBusy,
    beginApply,
    endApply,
  } = usePlanGridHistory();

  const [state, setState] = useState<PlanEditorState>({
    plan: null,
    grid: [],
    loading: true,
    publishing: false,
    deleting: false,
    duplicating: false,
    planTitle: "",
    planGoal: "",
    planNotes: "",
    planWeeks: "",
    weekMeta: {},
    expandedWeek: null,
    weekClipboard: null,
    picker: null,
    cellMenu: null,
    confirmDialog: null,
    noteEditor: null,
    noteSaving: false,
    saveStatus: "idle",
  });

  function patch<K extends keyof PlanEditorState>(key: K, value: PlanEditorState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  const load = useCallback((opts?: { resetHistory?: boolean }) => {
    api.get<PlanDetail>(`/coach/plans/${planId}`)
      .then((p) => {
        const meta: WeekMetaState = {};
        p.weeks.forEach((w) => { meta[w.weekNumber] = { title: w.title ?? "", notes: w.notes ?? "" }; });
        const cols = p.periodDays ?? 7;
        const g: Array<Array<CellData | null>> = Array.from({ length: p.weeksCount }, (_, wi) => {
          const week = p.weeks?.find((w) => w.weekNumber === wi + 1);
          return Array.from({ length: cols }, (_, di) => {
            const pw = week?.workouts.find((w) => w.sortOrder === di);
            if (!pw) return null;
            return {
              pwwId: pw.id,
              templateId: pw.workoutTemplate.id,
              title: pw.workoutTemplate.title,
              tags: pw.workoutTemplate.tags,
              exerciseCount: pw.workoutTemplate.exerciseCount,
              progressionNote: pw.progressionNote ?? null,
            };
          });
        });
        setState((s) => ({
          ...s,
          plan: p,
          planTitle: p.title,
          planGoal: p.goal ?? "",
          planNotes: p.notes ?? "",
          planWeeks: String(p.weeksCount),
          weekMeta: meta,
          grid: g,
          loading: false,
        }));
        if (opts?.resetHistory) clearGridHistory();
      })
      .catch(console.error)
      .finally(() => patch("loading", false));
  }, [api, planId, clearGridHistory]);

  useEffect(() => { load({ resetHistory: true }); }, [load]);

  const savePlanField = useCallback(async (field: Record<string, unknown>) => {
    patch("saveStatus", "saving");
    try {
      await api.patch(`/coach/plans/${planId}`, field);
      patch("saveStatus", "saved");
      window.setTimeout(() => {
        setState((s) => (s.saveStatus === "saved" ? { ...s, saveStatus: "idle" } : s));
      }, 1800);
    } catch (e) {
      console.error(e);
      patch("saveStatus", "error");
      toast.error("No se pudo guardar el plan");
    }
  }, [api, planId, toast]);

  const saveWeekMeta = useCallback(async (weekNumber: number) => {
    const meta = state.weekMeta[weekNumber] ?? { title: "", notes: "" };
    patch("saveStatus", "saving");
    try {
      const payload: Record<string, unknown> = {
        title: meta.title || null,
        notes: meta.notes || null,
      };
      await api.patch(`/coach/plans/${planId}/weeks/${weekNumber}`, payload);
      patch("saveStatus", "saved");
      window.setTimeout(() => {
        setState((s) => (s.saveStatus === "saved" ? { ...s, saveStatus: "idle" } : s));
      }, 1800);
    } catch (e) {
      console.error(e);
      patch("saveStatus", "error");
      toast.error("No se pudo guardar la semana");
    }
  }, [api, planId, state.weekMeta, toast]);

  const togglePublish = useCallback(async () => {
    if (!state.plan) return;
    patch("publishing", true);
    const next = state.plan.status === "published" ? "draft" : "published";
    try {
      await api.patch(`/coach/plans/${planId}`, { status: next });
      setState((s) => s.plan ? { ...s, plan: { ...s.plan, status: next }, publishing: false } : s);
      toast.success(next === "published" ? "Plan publicado" : "Plan vuelto a borrador");
    } catch {
      toast.error("No se pudo actualizar el plan");
      patch("publishing", false);
    }
  }, [api, planId, state.plan, toast]);

  const handleDelete = useCallback((onDeleted: () => void) => {
    if (!state.plan) return;
    patch("confirmDialog", {
      message: `¿Eliminar el plan "${state.plan.title}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        patch("confirmDialog", null);
        patch("deleting", true);
        try {
          await api.del(`/coach/plans/${planId}`);
          toast.success("Plan eliminado");
          onDeleted();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al eliminar");
          patch("deleting", false);
        }
      },
    });
  }, [api, planId, state.plan, toast]);

  const handleDuplicate = useCallback((onDuplicated: (id: string) => void) => {
    if (!state.plan) return;
    patch("confirmDialog", {
      message: `¿Duplicar el plan "${state.plan.title}"? Se creará una copia en borrador.`,
      onConfirm: async () => {
        patch("confirmDialog", null);
        patch("duplicating", true);
        try {
          const res = await api.post<{ id: string }>(`/coach/plans/${planId}/duplicate`, {});
          toast.success("Plan duplicado");
          onDuplicated(res.id);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No se pudo duplicar el plan");
          patch("duplicating", false);
        }
      },
    });
  }, [api, planId, state.plan, toast]);

  const syncGridToApi = useCallback(async (grid: Array<Array<CellData | null>>) => {
    for (let wi = 0; wi < grid.length; wi++) {
      const row = grid[wi] ?? [];
      await api.put(`/coach/plans/${planId}/weeks/${wi + 1}/workouts`, {
        items: weekItemsFromRow(row),
      });
    }
    load();
  }, [api, planId, load]);

  const undo = useCallback(async () => {
    const prev = undoGrid(clonePlanGrid(state.grid));
    if (!prev) return;
    beginApply();
    setState((s) => ({ ...s, grid: prev, cellMenu: null }));
    try {
      await syncGridToApi(prev);
      toast.success("Cambio deshecho");
    } catch {
      toast.error("No se pudo deshacer");
      load();
    } finally {
      endApply();
    }
  }, [undoGrid, state.grid, beginApply, endApply, syncGridToApi, toast, load]);

  const redo = useCallback(async () => {
    const next = redoGrid(clonePlanGrid(state.grid));
    if (!next) return;
    beginApply();
    setState((s) => ({ ...s, grid: next, cellMenu: null }));
    try {
      await syncGridToApi(next);
      toast.success("Cambio rehecho");
    } catch {
      toast.error("No se pudo rehacer");
      load();
    } finally {
      endApply();
    }
  }, [redoGrid, state.grid, beginApply, endApply, syncGridToApi, toast, load]);

  const handleMoveCell = useCallback(async (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number) => {
    if (fromWeekIndex === toWeekIndex && fromDayIndex === toDayIndex) return;
    const from = state.grid[fromWeekIndex]?.[fromDayIndex] ?? null;
    if (!from) return;

    captureGrid(state.grid);
    patch("cellMenu", null);

    setState((prev) => {
      const next = prev.grid.map((row) => row.slice());
      const a = next[fromWeekIndex]?.[fromDayIndex] ?? null;
      const b = next[toWeekIndex]?.[toDayIndex] ?? null;
      if (!a) return prev;
      next[toWeekIndex][toDayIndex] = a;
      next[fromWeekIndex][fromDayIndex] = b;
      return { ...prev, grid: next };
    });

    try {
      await api.put(`/coach/plans/${planId}/move`, {
        fromWeekNumber: fromWeekIndex + 1,
        fromSortOrder: fromDayIndex,
        toWeekNumber: toWeekIndex + 1,
        toSortOrder: toDayIndex,
      });
    } catch {
      load();
    }
  }, [api, planId, state.grid, load, captureGrid]);

  const handleCellSelect = useCallback(async (template: TemplateSummary) => {
    const picker = state.picker;
    if (!picker) return;
    const { week, day } = picker;
    captureGrid(state.grid);
    patch("picker", null);
    const cell: CellData = { pwwId: "", templateId: template.id, title: template.title, tags: template.tags, exerciseCount: template.exerciseCount, progressionNote: null };

    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((row, wi) => wi === week ? row.map((c, di) => di === day ? cell : c) : row),
    }));

    try {
      const res = await api.put<{ pwwId: string }>(`/coach/plans/${planId}/cell`, { weekNumber: week + 1, sortOrder: day, workoutTemplateId: template.id });
      setState((prev) => ({
        ...prev,
        grid: prev.grid.map((row, wi) => wi === week ? row.map((c, di) => di === day ? { ...cell, pwwId: res.pwwId } : c) : row),
      }));
    } catch {
      load();
    }
  }, [api, planId, state.picker, state.grid, load, captureGrid]);

  const handleCellClear = useCallback(async (week: number, day: number) => {
    captureGrid(state.grid);
    patch("cellMenu", null);
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((row, wi) => wi === week ? row.map((c, di) => di === day ? null : c) : row),
    }));
    try {
      await api.del(`/coach/plans/${planId}/cell`, { weekNumber: week + 1, sortOrder: day });
    } catch {
      load();
    }
  }, [api, planId, state.grid, load, captureGrid]);

  const handleEditProgressionNote = useCallback((weekIndex: number, dayIndex: number) => {
    const cell = state.grid[weekIndex]?.[dayIndex] ?? null;
    if (!cell?.pwwId) return;
    patch("noteEditor", {
      week: weekIndex,
      day: dayIndex,
      pwwId: cell.pwwId,
      title: cell.title,
      value: cell.progressionNote ?? "",
    });
  }, [state.grid]);

  const saveProgressionNote = useCallback(async () => {
    const editor = state.noteEditor;
    if (!editor) return;
    const trimmed = editor.value.trim();
    patch("noteSaving", true);
    try {
      const res = await api.patch<{ pwwId: string; progressionNote: string | null }>(`/coach/plans/${planId}/cell`, {
        pwwId: editor.pwwId,
        progressionNote: trimmed ? trimmed : null,
      });
      setState((prev) => ({
        ...prev,
        grid: prev.grid.map((row, wi) =>
          wi === editor.week
            ? row.map((c, di) => (di === editor.day && c ? { ...c, progressionNote: res.progressionNote } : c))
            : row,
        ),
        noteSaving: false,
        noteEditor: null,
      }));
      toast.success("Nota guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
      patch("noteSaving", false);
    }
  }, [api, planId, state.noteEditor, toast]);

  const copyWeek = useCallback((weekNumber: number) => {
    const row = state.grid[weekNumber - 1] ?? [];
    patch("weekClipboard", row.map((c) => (c ? { ...c, pwwId: "" } : null)));
    toast.success(`Semana ${weekNumber} copiada`);
  }, [state.grid, toast]);

  const applyWeekReplace = useCallback(async (weekNumber: number, sourceRow: Array<CellData | null>) => {
    captureGrid(state.grid);
    const targetRow = sourceRow.map((c) => (c ? { ...c, pwwId: "" } : null));
    setState((prev) => ({
      ...prev,
      grid: prev.grid.map((row, wi) => (wi === weekNumber - 1 ? targetRow : row)),
    }));

    const items = weekItemsFromRow(targetRow);

    try {
      await api.put(`/coach/plans/${planId}/weeks/${weekNumber}/workouts`, { items });
      toast.success(`Semana ${weekNumber} actualizada`);
      load();
    } catch {
      toast.error("No se pudo actualizar la semana");
      load();
    }
  }, [api, planId, load, toast, captureGrid, state.grid]);

  const pasteWeek = useCallback(async (weekNumber: number) => {
    if (!state.weekClipboard) return;
    await applyWeekReplace(weekNumber, state.weekClipboard);
  }, [state.weekClipboard, applyWeekReplace]);

  const clearWeek = useCallback((weekNumber: number) => {
    patch("confirmDialog", {
      message: `¿Vaciar la semana ${weekNumber}? Se quitarán todos los entrenos.`,
      onConfirm: async () => {
        patch("confirmDialog", null);
        captureGrid(state.grid);
        setState((prev) => ({
          ...prev,
          grid: prev.grid.map((row, wi) => (wi === weekNumber - 1 ? row.map(() => null) : row)),
        }));
        try {
          await api.del(`/coach/plans/${planId}/weeks/${weekNumber}/workouts`);
          toast.success(`Semana ${weekNumber} vaciada`);
          load();
        } catch {
          toast.error("No se pudo vaciar la semana");
          load();
        }
      },
    });
  }, [api, planId, load, toast, captureGrid, state.grid]);

  const duplicateWeek = useCallback(async (fromWeekNumber: number, toWeekNumber: number) => {
    const row = state.grid[fromWeekNumber - 1] ?? [];
    const cloned = row.map((c) => (c ? { ...c, pwwId: "" } : null));
    patch("weekClipboard", cloned);
    await applyWeekReplace(toWeekNumber, cloned);
  }, [state.grid, applyWeekReplace]);

  return {
    state,
    load,
    patch,
    savePlanField,
    saveWeekMeta,
    togglePublish,
    handleDelete,
    handleDuplicate,
    handleMoveCell,
    handleCellSelect,
    handleCellClear,
    handleEditProgressionNote,
    saveProgressionNote,
    copyWeek,
    pasteWeek,
    clearWeek,
    duplicateWeek,
    undo,
    redo,
    canUndo,
    canRedo,
    historyBusy,
  };
}
