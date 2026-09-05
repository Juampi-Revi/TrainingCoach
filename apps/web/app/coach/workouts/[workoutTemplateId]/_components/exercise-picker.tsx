"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL } from "@/lib/constants";
import type { WE, ExerciseOption } from "./_types";
import { ExercisePickerFilters } from "./exercise-picker-filters";

export function ExercisePicker({ templateId, blockId, onAdd, onClose }: {
  templateId: string;
  blockId: string;
  onAdd: (we: WE) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [objective, setObjective] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [exercises, setExercises] = useState<ExerciseOption[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [creatingLoading, setCreatingLoading] = useState(false);

  useEffect(() => {
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (muscle) params.set("muscle", muscle);
    if (equipment.trim()) params.set("equipment", equipment.trim());
    if (difficulty) params.set("difficulty", difficulty);
    if (objective) params.set("objective", objective);
    if (favoritesOnly) params.set("favorites", "true");
    params.set("limit", "60");
    const qs = params.toString();
    api.get<ExerciseOption[]>(`/coach/exercises${qs ? `?${qs}` : ""}`)
      .then(setExercises)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "No se pudo cargar ejercicios");
        setExercises([]);
      });
  }, [api, search, muscle, equipment, difficulty, objective, favoritesOnly, toast]);

  async function toggleFavorite(exerciseId: string, next: boolean) {
    try {
      if (next) await api.post(`/coach/exercises/${exerciseId}/favorite`, {});
      else await api.del(`/coach/exercises/${exerciseId}/favorite`);
      setExercises((prev) => (prev ? prev.map((x) => (x.id === exerciseId ? { ...x, isFavorite: next } : x)) : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar favorito");
    }
  }

  async function handleAdd(ex: ExerciseOption) {
    setAdding(ex.id);
    try {
      if (!blockId) {
        throw new Error("blockId is required");
      }
      const we = await api.post<WE>(`/coach/workouts/${templateId}/exercises`, { exerciseId: ex.id, workoutBlockId: blockId });
      onAdd(we);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo agregar el ejercicio");
    } finally {
      setAdding(null);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    if (!blockId) {
      toast.error("No se pudo crear: falta el bloque");
      return;
    }
    setCreatingLoading(true);
    try {
      const ex = await api.post<ExerciseOption>("/coach/exercises", { name, primaryMuscle: newMuscle || null });
      const we = await api.post<WE>(`/coach/workouts/${templateId}/exercises`, { exerciseId: ex.id, workoutBlockId: blockId });
      onAdd(we);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear el ejercicio");
    } finally {
      setCreatingLoading(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "0 16px" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, maxHeight: "80vh", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Agregar ejercicio</div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                onClose();
                router.push(
                  `/coach/ejercicios?templateId=${encodeURIComponent(templateId)}&blockId=${encodeURIComponent(blockId)}&context=workout&returnTo=${encodeURIComponent(`/coach/workouts/${templateId}`)}`,
                );
              }}
              style={{
                height: 30,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)",
                color: "var(--text)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              className="ta-row"
            >
              <Icon name="book" size={14} color="var(--text)" />
              Biblioteca
            </button>
          </div>
          {!creating ? (
            <ExercisePickerFilters
              search={search}
              setSearch={setSearch}
              muscle={muscle}
              setMuscle={setMuscle}
              equipment={equipment}
              setEquipment={setEquipment}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              objective={objective}
              setObjective={setObjective}
              favoritesOnly={favoritesOnly}
              setFavoritesOnly={setFavoritesOnly}
              onDirty={() => setExercises(null)}
              onClear={() => {
                setMuscle("");
                setEquipment("");
                setDifficulty("");
                setObjective("");
                setFavoritesOnly(false);
              }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                placeholder="Nombre del ejercicio *"
                style={{ height: 38, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 12px", fontSize: 14, color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
              <select
                value={newMuscle}
                onChange={(e) => setNewMuscle(e.target.value)}
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontSize: 13, color: newMuscle ? "var(--text)" : "var(--text-mute)", outline: "none", width: "100%", boxSizing: "border-box" }}
              >
                <option value="">Músculo (opcional)</option>
                {Object.entries(MUSCLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setCreating(false)} style={{ flex: 1, height: 34, borderRadius: 8, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleCreate} disabled={!newName.trim() || creatingLoading} style={{ flex: 2, height: 34, borderRadius: 8, border: "none", background: "var(--lime)", color: "var(--text-on-accent)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !newName.trim() || creatingLoading ? 0.5 : 1 }}>
                  {creatingLoading ? "Creando…" : "Crear y agregar"}
                </button>
              </div>
            </div>
          )}
        </div>
        {!creating && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {exercises === null ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
            ) : exercises.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
                <div style={{ marginBottom: 12 }}>Sin resultados para {`"${search}"`}</div>
                <button onClick={() => { setCreating(true); setNewName(search); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Crear {`"${search}"`}
                </button>
              </div>
            ) : (
              <>
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={(e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest("[data-stop-row-click='true']")) return;
                      void handleAdd(ex);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--line)", cursor: adding === ex.id ? "wait" : "pointer", opacity: adding === ex.id ? 0.5 : 1 }}
                    className="ta-row"
                  >
                    <div style={{ position: "relative", width: 48, height: 48, borderRadius: 8, background: ex.thumbnailUrl ? "var(--bg-2)" : ex.youtubeUrl ? "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)" : "var(--bg-2)", border: ex.thumbnailUrl || ex.youtubeUrl ? "1px solid var(--line-2)" : "1px dashed var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {ex.thumbnailUrl ? (
                        <Image src={ex.thumbnailUrl} alt="" fill sizes="48px" style={{ objectFit: "cover" }} unoptimized />
                      ) : ex.youtubeUrl ? (
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.95)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Icon name="play" size={12} color="#FF0000" />
                        </div>
                      ) : (
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: "var(--bg-3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px dashed var(--line-2)",
                        }}>
                          <Icon name="dumbbell" size={14} color="var(--text-mute)" />
                        </div>
                      )}
                      {ex.youtubeUrl && ex.thumbnailUrl && (
                        <div style={{ position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="play" size={7} color="#fff" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>
                        {ex.primaryMuscle ? (MUSCLE_LABEL[ex.primaryMuscle] ?? ex.primaryMuscle) : "—"}
                        {ex.equipment ? ` · ${ex.equipment}` : ""}
                      </div>
                    </div>
                    <button
                      data-stop-row-click="true"
                      onClick={() => void toggleFavorite(ex.id, !ex.isFavorite)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line-2)", background: ex.isFavorite ? "rgba(215,255,58,.12)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      aria-label={ex.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                      disabled={adding === ex.id}
                    >
                      <Icon name="star" size={14} color={ex.isFavorite ? "var(--lime)" : "var(--text-mute)"} />
                    </button>
                    <Icon name="plus" size={16} color="var(--text-mute)" />
                  </div>
                ))}
                <button
                  onClick={() => { setCreating(true); setNewName(search); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 20px", background: "transparent", border: "none", borderTop: "1px solid var(--line)", cursor: "pointer", color: "var(--text-dim)", fontSize: 13 }}
                >
                  <Icon name="plus" size={14} color="var(--text-dim)" />
                  Crear nuevo ejercicio
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
