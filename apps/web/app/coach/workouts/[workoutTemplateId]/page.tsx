"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { WorkoutTemplateDetail } from "@regen/types";
import { GROUP_LETTERS } from "@/lib/constants";
import { estimateWorkoutDurationSeconds, formatBlockDurationShort } from "@/lib/training-blocks";
import type { WE } from "./_components/_types";
import { ExercisePicker } from "./_components/exercise-picker";
import { ExerciseInspector } from "./_components/exercise-inspector";
import { WorkoutProperties } from "./_components/workout-properties";
import { BlockModal } from "./_components/block-modal";
import type { WorkoutSport } from "@regen/types";
import { WorkoutBuilderBlocks } from "./_components/workout-builder-blocks";
import { WorkoutStudentPreview } from "./_components/workout-student-preview";
import "./_styles.css";

export default function TemplateEditorPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { workoutTemplateId } = useParams<{ workoutTemplateId: string }>();
  const [data, setData] = useState<WorkoutTemplateDetail | null>(null);
  const [exercises, setExercises] = useState<WE[]>([]);
  const [blocks, setBlocks] = useState<WorkoutTemplateDetail["blocks"]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<WorkoutSport>("generic");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerBlockId, setPickerBlockId] = useState<string | null>(null);
  const [selectedWeId, setSelectedWeId] = useState<string | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const load = useCallback(() => {
    api.get<WorkoutTemplateDetail>(`/coach/workouts/${workoutTemplateId}`)
      .then((d) => {
        setData(d);
        setExercises(d.exercises as WE[]);
        setBlocks(d.blocks ?? []);
        setTitle(d.title);
        setDescription(d.description ?? "");
        setSport(d.sport ?? "generic");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, workoutTemplateId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/coach/workouts/${workoutTemplateId}`, {
        title,
        description,
        sport,
      });
      setSaved(true);
      toast.success("Entrenamiento guardado");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function duplicateTemplate() {
    setDuplicating(true);
    try {
      const res = await api.post<{ id: string }>(`/coach/workouts/${workoutTemplateId}/duplicate`, {});
      toast.success("Entrenamiento duplicado");
      router.push(`/coach/workouts/${res.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo duplicar");
      setDuplicating(false);
    }
  }

  function updateExercise(id: string, patch: Partial<WE>) {
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
  }

  function updateGroupExercises(blockId: string, group: string, patch: Partial<WE>) {
    setExercises((prev) =>
      prev.map((e) =>
        e.workoutBlockId === blockId && e.supersetGroup === group
          ? { ...e, ...patch }
          : e,
      ),
    );
  }

  function moveExerciseInSection(id: string, direction: "up" | "down", blockId: string) {
    setExercises((prev) => {
      const section = prev.filter((e) => e.workoutBlockId === blockId);
      const secIdx = section.findIndex((e) => e.id === id);
      const swapSecIdx = direction === "up" ? secIdx - 1 : secIdx + 1;
      if (swapSecIdx < 0 || swapSecIdx >= section.length) return prev;
      const realIdx = prev.findIndex((e) => e.id === id);
      const realSwapIdx = prev.findIndex((e) => e.id === section[swapSecIdx]!.id);
      const next = [...prev];
      [next[realIdx], next[realSwapIdx]] = [next[realSwapIdx]!, next[realIdx]!];
      return next.map((e, i) => ({ ...e, sortOrder: i }));
    });
    const we = exercises.find((e) => e.id === id)!;
    const newOrder = we.sortOrder + (direction === "up" ? -1.5 : 1.5);
    api.patch(`/coach/workouts/${workoutTemplateId}/exercises/${id}`, { sortOrder: newOrder }).catch(console.error);
  }

  async function setExerciseGroup(id: string, group: string | null) {
    const current = exercises.find((e) => e.id === id) ?? null;
    const source = group && current
      ? exercises.find((e) => e.id !== id && e.workoutBlockId === current.workoutBlockId && e.supersetGroup === group) ?? null
      : null;
    setExercises((prev) => prev.map((e) => e.id === id ? {
      ...e,
      supersetGroup: group,
      groupNote: group ? (source?.groupNote ?? e.groupNote) : null,
      groupIsExtra: group ? (source?.groupIsExtra ?? false) : false,
      groupLabels: group ? (source?.groupLabels ?? e.groupLabels) : { role: null, effort: null, execution: null },
    } : e));
    try {
      await api.patch(`/coach/workouts/${workoutTemplateId}/exercises/${id}`, { supersetGroup: group });
    } catch (e) { console.error(e); }
  }

  async function deleteExercise(id: string) {
    try {
      await api.del(`/coach/workouts/${workoutTemplateId}/exercises/${id}`);
      setExercises((prev) => prev.filter((e) => e.id !== id));
      if (selectedWeId === id) setSelectedWeId(null);
    } catch (e) { console.error(e); }
  }

  async function reorderBlocks(nextSorted: WorkoutTemplateDetail["blocks"]) {
    const prev = blocks;
    const nextWithOrder = nextSorted.map((b, index) => ({ ...b, sortOrder: index }));
    setBlocks(nextWithOrder);
    try { await api.put(`/coach/workouts/${workoutTemplateId}/blocks`, { blockIds: nextWithOrder.map((b) => b.id) }); }
    catch (e) { console.error(e); setBlocks(prev); toast.error("No se pudo reordenar el bloque"); }
  }

  const usedGroups = [...new Set(exercises
    .map((e) => e.supersetGroup)
    .filter(Boolean) as string[]
  )].sort();
  const nextGroup = GROUP_LETTERS.find((l) => !usedGroups.includes(l)) ?? "A";
  const groupSizes: Record<string, number> = {};
  exercises.forEach((we) => {
    if (we.supersetGroup) {
      groupSizes[we.supersetGroup] = (groupSizes[we.supersetGroup] ?? 0) + 1;
    }
  });

  const blocksSorted = [...blocks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const totalEstimated = formatBlockDurationShort(estimateWorkoutDurationSeconds(blocksSorted));
  const selectedWe = selectedWeId ? exercises.find((e) => e.id === selectedWeId) ?? null : null;
  const editingBlock = editingBlockId ? blocks.find((b) => b.id === editingBlockId) ?? null : null;

  if (loading) {
    return <DesktopShell active="templates" coachName={user?.name ?? "Coach"}><StateBlock kind="loading" title="Cargando entrenamiento…" /></DesktopShell>;
  }

  if (!data) {
    return <DesktopShell active="templates" coachName={user?.name ?? "Coach"}><StateBlock kind="error" title="Entrenamiento no encontrado" /></DesktopShell>;
  }

  return (
    <>
      <DesktopShell
        active="templates"
        title={
          <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
            Entrenamientos <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{data.title}</span>
          </span>
        }
        subtitle={saved ? "✓ Guardado" : mode === "preview" ? "Vista alumno" : "editando"}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <div
              role="tablist"
              aria-label="Modo del builder"
              style={{
                display: "inline-flex",
                gap: 2,
                padding: 3,
                borderRadius: 10,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)",
              }}
            >
              {([{ id: "edit" as const, label: "Editar" }, { id: "preview" as const, label: "Vista alumno" }]).map((opt) => {
                const active = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setMode(opt.id)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-sans)",
                      background: active ? "var(--bg-1)" : "transparent",
                      color: active ? "var(--text)" : "var(--text-mute)",
                      boxShadow: active ? "var(--shadow-sm)" : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/coach/workouts")}>Volver</Button>
            <Button variant="outline" size="sm" icon="repeat" disabled={duplicating || saving} onClick={duplicateTemplate}>
              {duplicating ? "Duplicando…" : "Duplicar"}
            </Button>
            <Button size="sm" icon="check" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </>
        }
      >
        <div className="workout-builder-layout">
          {mode === "preview" ? (
            <WorkoutStudentPreview
              title={data.title}
              description={data.description ?? null}
              blocksSorted={blocksSorted}
              exercises={exercises}
            />
          ) : (
            <>
              <WorkoutBuilderBlocks
                title={data.title}
                description={data.description ?? null}
                exercises={exercises}
                blocksSorted={blocksSorted}
                totalEstimated={totalEstimated}
                usedGroups={usedGroups}
                selectedWeId={selectedWeId}
                onSelectWe={(id) => setSelectedWeId((cur) => (cur === id ? null : id))}
                onReorderBlocks={reorderBlocks}
                onEditBlock={(id) => { setEditingBlockId(id); setBlockModalOpen(true); }}
                onLibrary={(blockId) =>
                  router.push(
                    `/coach/ejercicios?templateId=${encodeURIComponent(workoutTemplateId)}&blockId=${encodeURIComponent(blockId)}&context=workout&returnTo=${encodeURIComponent(`/coach/workouts/${workoutTemplateId}`)}`,
                  )
                }
                onAddExercise={(blockId) => { setPickerBlockId(blockId); setShowPicker(true); }}
                onCreateFirstBlock={() => { setEditingBlockId(null); setBlockModalOpen(true); }}
                onAddBlock={() => { setEditingBlockId(null); setBlockModalOpen(true); }}
                onMoveExercise={moveExerciseInSection}
                onDeleteExercise={deleteExercise}
              />

          {/* ── Right panel: inspector or properties ── */}
          <div className="workout-builder-panel">
            {selectedWe ? (
              <ExerciseInspector
                we={selectedWe}
                templateId={workoutTemplateId}
                blocks={blocks}
                usedGroups={usedGroups}
                groupSizes={groupSizes}
                nextGroup={nextGroup}
                onUpdate={(patch) => updateExercise(selectedWe.id, patch)}
                onUpdateGroupMeta={(patch) => {
                  if (!selectedWe.supersetGroup) return;
                  updateGroupExercises(selectedWe.workoutBlockId, selectedWe.supersetGroup, patch);
                }}
                onSetGroup={(group) => setExerciseGroup(selectedWe.id, group)}
                onClose={() => setSelectedWeId(null)}
              />
            ) : (
              <WorkoutProperties
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
              sport={sport}
              setSport={setSport}
                usedGroups={usedGroups}
                groupSizes={groupSizes}
              />
            )}
          </div>
            </>
          )}
        </div>
      </DesktopShell>

      {showPicker && pickerBlockId && (
        <ExercisePicker
          templateId={workoutTemplateId}
          blockId={pickerBlockId}
          onAdd={(we) => setExercises((prev) => [...prev, we])}
          onClose={() => setShowPicker(false)}
        />
      )}

      {blockModalOpen && (
        <BlockModal
          templateId={workoutTemplateId}
          block={editingBlockId ? editingBlock : null}
          onClose={() => setBlockModalOpen(false)}
          onSaved={(next) => {
            setBlocks((prev) => {
              const exists = prev.some((b) => b.id === next.id);
              return exists ? prev.map((b) => (b.id === next.id ? next : b)) : [...prev, next];
            });
          }}
          onDeleted={(id) => {
            setBlocks((prev) => prev.filter((b) => b.id !== id));
            // Exercises are cascade deleted in the DB, remove them from local state
            setExercises((prev) => prev.filter((e) => e.workoutBlockId !== id));
          }}
        />
      )}
    </>
  );
}
