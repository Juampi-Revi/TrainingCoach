"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { WorkoutTemplateDetail } from "@regen/types";
import { GROUP_COLORS, GROUP_LETTERS, groupLabel, blockTypeLabel, blockSummary } from "@/lib/constants";
import type { WE } from "./_components/_types";
import { ExercisePicker } from "./_components/exercise-picker";
import { ExerciseRow } from "./_components/exercise-row";
import { ExerciseInspector } from "./_components/exercise-inspector";
import { WorkoutProperties } from "./_components/workout-properties";
import { BlockModal } from "./_components/block-modal";
import { Icon } from "@/components/ui";
import type { WorkoutSport } from "@regen/types";

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
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, supersetGroup: group } : e));
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
        subtitle={saved ? "✓ Guardado" : "editando"}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "calc(100vh - 74px)" }}>

          {/* ── Exercise list ── */}
          <div style={{ overflow: "auto" }}>
            <div style={{ padding: "20px 24px 12px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>{data.title}</div>
              {data.description && <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>{data.description}</div>}
              <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "var(--text-mute)" }}>
                <span>{exercises.length} ejercicios</span>
                {usedGroups.length > 0 && <><span>·</span><span>{usedGroups.length} grupo{usedGroups.length > 1 ? "s" : ""}</span></>}
              </div>
            </div>

            <div style={{ margin: "0 24px 24px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>

              {blocksSorted.length === 0 && exercises.length === 0 && (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "var(--text-mute)", marginBottom: 16 }}>
                    Este entrenamiento no tiene bloques todavía.
                  </div>
                  <Button variant="outline" size="sm" icon="plus" onClick={() => { setEditingBlockId(null); setBlockModalOpen(true); }}>
                    Crear primer bloque
                  </Button>
                </div>
              )}

              {blocksSorted.map((b, bIdx) => {
                const blockExercises = exercises
                  .filter((e) => e.workoutBlockId === b.id)
                  .sort((a, c) => a.sortOrder - c.sortOrder);
                const isLast = bIdx === blocksSorted.length - 1;
                const canMoveUp = bIdx > 0;
                const canMoveDown = bIdx < blocksSorted.length - 1;
                return (
                  <div key={b.id} style={{ borderBottom: isLast ? "none" : "1px solid var(--line)" }}>
                    {/* Block Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-2)" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: b.type === "warmup" ? "rgba(255,142,114,.12)" : b.type === "cooldown" ? "rgba(167,139,250,.12)" : b.type === "cardio" ? "rgba(122,184,255,.12)" : "rgba(215,255,58,.12)",
                        border: `1px solid ${b.type === "warmup" ? "rgba(255,142,114,.25)" : b.type === "cooldown" ? "rgba(167,139,250,.25)" : b.type === "cardio" ? "rgba(122,184,255,.25)" : "rgba(215,255,58,.25)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <Icon
                          name={b.type === "warmup" ? "flame" : b.type === "cooldown" ? "moon" : b.type === "cardio" ? "repeat" : b.type === "intervals" ? "timer" : "dumbbell"}
                          size={14}
                          color={b.type === "warmup" ? "#FF8E72" : b.type === "cooldown" ? "#A78BFA" : b.type === "cardio" ? "#7AB8FF" : "var(--lime)"}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ta-mono" style={{
                          fontSize: 10, fontWeight: 800,
                          color: b.type === "warmup" ? "#FF8E72" : b.type === "cooldown" ? "#A78BFA" : b.type === "cardio" ? "#7AB8FF" : "var(--lime)",
                          letterSpacing: ".08em"
                        }}>
                          {blockTypeLabel(b.type, b.intervalType).toUpperCase()} {b.label ? `· ${b.label}` : ""} · {blockSummary(b)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                          {blockExercises.length} ejercicio{blockExercises.length === 1 ? "" : "s"}
                          {b.targetMinutes ? ` · ${b.targetMinutes} min` : ""}
                          {b.restBetweenExercisesSeconds ? ` · descanso ${b.restBetweenExercisesSeconds}s` : ""}
                          {b.restAfterSeconds ? ` · descanso post ${b.restAfterSeconds}s` : ""}
                        </div>
                        {b.description && (
                          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2, fontStyle: "italic" }}>
                            {b.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button variant="ghost" size="sm" icon="chevUp" title="Mover bloque arriba" ariaLabel="Mover bloque arriba" disabled={!canMoveUp} onClick={() => { if (!canMoveUp) return; const next = [...blocksSorted]; const swapIdx = bIdx - 1; [next[bIdx], next[swapIdx]] = [next[swapIdx]!, next[bIdx]!]; void reorderBlocks(next); }} />
                        <Button variant="ghost" size="sm" icon="chevD" title="Mover bloque abajo" ariaLabel="Mover bloque abajo" disabled={!canMoveDown} onClick={() => { if (!canMoveDown) return; const next = [...blocksSorted]; const swapIdx = bIdx + 1; [next[bIdx], next[swapIdx]] = [next[swapIdx]!, next[bIdx]!]; void reorderBlocks(next); }} />
                        <Button variant="outline" size="sm" onClick={() => { setEditingBlockId(b.id); setBlockModalOpen(true); }}>
                          Configurar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="book"
                          onClick={() =>
                            router.push(
                              `/coach/ejercicios?templateId=${encodeURIComponent(workoutTemplateId)}&blockId=${encodeURIComponent(b.id)}&context=workout&returnTo=${encodeURIComponent(`/coach/workouts/${workoutTemplateId}`)}`,
                            )
                          }
                        >
                          Biblioteca
                        </Button>
                        <Button variant="ghost" size="sm" icon="plus" onClick={() => { setPickerBlockId(b.id); setShowPicker(true); }}>
                          Ejercicio
                        </Button>
                      </div>
                    </div>

                    {/* Exercises in block */}
                    {blockExercises.length === 0 && (
                      <div style={{ padding: "14px 14px", borderBottom: "1px solid var(--line)", background: "var(--bg-1)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: "var(--bg-2)", border: "1px solid var(--line-2)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Icon name="plus" size={14} color="var(--text-mute)" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                              Este bloque todavía no tiene ejercicios
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.35 }}>
                              Agregá ejercicios para que el bloque tenga contenido. Si es EMOM, los ejercicios se alternan por minuto.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {blockExercises.map((we) => {
                      const secIdx = blockExercises.findIndex((e) => e.id === we.id);
                      const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
                      const isGroupStart = we.supersetGroup !== null && blockExercises.findIndex((e) => e.supersetGroup === we.supersetGroup) === secIdx;
                      return (
                        <div key={we.id}>
                          {isGroupStart && we.supersetGroup && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px 3px 17px", background: "var(--bg-2)", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${gc}` }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: gc ?? "transparent" }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em" }}>
                                {groupLabel(blockExercises.filter((x) => x.supersetGroup === we.supersetGroup).length)} {we.supersetGroup}
                              </span>
                              <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 4 }}>
                                · {blockExercises.filter((x) => x.supersetGroup === we.supersetGroup).length} ejercicios
                              </span>
                              {we.groupNote && (
                                <span style={{ fontSize: 10, color: gc ?? "var(--text-mute)", opacity: 0.85, marginLeft: 4, fontStyle: "italic" }}>
                                  · {we.groupNote}
                                </span>
                              )}
                            </div>
                          )}
                          <ExerciseRow
                            we={we}
                            blockType={b.type}
                            intervalType={b.intervalType}
                            selected={selectedWeId === we.id}
                            onSelect={() => setSelectedWeId((id) => id === we.id ? null : we.id)}
                            onMoveUp={secIdx > 0 ? () => moveExerciseInSection(we.id, "up", b.id) : null}
                            onMoveDown={secIdx < blockExercises.length - 1 ? () => moveExerciseInSection(we.id, "down", b.id) : null}
                            onDelete={() => deleteExercise(we.id)}
                          />
                        </div>
                      );
                    })}

                    {/* Add exercise button */}
                    <div style={{ padding: "8px 14px", display: "flex", gap: 8, justifyContent: "flex-start", background: "var(--bg-1)" }}>
                      <Button variant="ghost" size="sm" icon="plus" onClick={() => { setPickerBlockId(b.id); setShowPicker(true); }}>
                        Agregar ejercicio al bloque
                      </Button>
                    </div>
                  </div>
                );
              })}

              {blocksSorted.length > 0 && (
                <div style={{ padding: 10, borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "center" }}>
                  <Button variant="ghost" size="sm" icon="plus" onClick={() => { setEditingBlockId(null); setBlockModalOpen(true); }}>
                    Agregar bloque
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel: inspector or properties ── */}
          <div style={{ background: "var(--bg-1)", borderLeft: "1px solid var(--line)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {selectedWe ? (
              <ExerciseInspector
                we={selectedWe}
                templateId={workoutTemplateId}
                blocks={blocks}
                usedGroups={usedGroups}
                groupSizes={groupSizes}
                nextGroup={nextGroup}
                onUpdate={(patch) => updateExercise(selectedWe.id, patch)}
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
