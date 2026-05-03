"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { MUSCLE_LABEL } from "@/lib/constants";
import type { WE, ExerciseOption } from "./_types";

export function ExercisePicker({ templateId, defaultWarmup, blockId, onAdd, onClose }: {
  templateId: string;
  defaultWarmup: boolean;
  blockId?: string | null;
  onAdd: (we: WE) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<ExerciseOption[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [asWarmup, setAsWarmup] = useState(defaultWarmup);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [creatingLoading, setCreatingLoading] = useState(false);

  useEffect(() => {
    const q = search.trim();
    api.get<ExerciseOption[]>(`/coach/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setExercises)
      .catch((e) => { console.error(e); setExercises([]); });
  }, [api, search]);

  async function handleAdd(ex: ExerciseOption) {
    setAdding(ex.id);
    try {
      const we = await api.post<WE>(`/coach/workouts/${templateId}/exercises`, { exerciseId: ex.id, isWarmup: asWarmup, ...(blockId ? { workoutBlockId: blockId } : {}) });
      onAdd(we);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(null);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreatingLoading(true);
    try {
      const ex = await api.post<ExerciseOption>("/coach/exercises", { name, primaryMuscle: newMuscle || null });
      const we = await api.post<WE>(`/coach/workouts/${templateId}/exercises`, { exerciseId: ex.id, isWarmup: asWarmup, ...(blockId ? { workoutBlockId: blockId } : {}) });
      onAdd(we);
      onClose();
    } catch (e) {
      console.error(e);
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
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Agregar ejercicio</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button
              onClick={() => setAsWarmup(false)}
              style={{ flex: 1, height: 32, borderRadius: 8, border: `1.5px solid ${!asWarmup ? "var(--line)" : "var(--line-2)"}`, background: !asWarmup ? "var(--bg-2)" : "transparent", color: !asWarmup ? "var(--text)" : "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ejercicio de trabajo
            </button>
            <button
              onClick={() => setAsWarmup(true)}
              style={{ flex: 1, height: 32, borderRadius: 8, border: `1.5px solid ${asWarmup ? "var(--lime)" : "var(--line-2)"}`, background: asWarmup ? "rgba(132,204,22,.12)" : "transparent", color: asWarmup ? "var(--accent-text)" : "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Calentamiento
            </button>
          </div>
          {!creating ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
              <Icon name="search" size={14} color="var(--text-mute)" />
              <input
                autoFocus
                value={search}
                onChange={(e) => { setSearch(e.target.value); setExercises(null); }}
                placeholder="Buscar ejercicio…"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
              />
            </div>
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
                <button onClick={handleCreate} disabled={!newName.trim() || creatingLoading} style={{ flex: 2, height: 34, borderRadius: 8, border: "none", background: "var(--lime)", color: "#0B0B0C", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !newName.trim() || creatingLoading ? 0.5 : 1 }}>
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
                <div style={{ marginBottom: 12 }}>Sin resultados para "{search}"</div>
                <button onClick={() => { setCreating(true); setNewName(search); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Crear "{search}"
                </button>
              </div>
            ) : (
              <>
                {exercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleAdd(ex)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--line)", cursor: adding === ex.id ? "wait" : "pointer", opacity: adding === ex.id ? 0.5 : 1 }}
                    className="ta-row"
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="dumbbell" size={16} color="var(--text-mute)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>
                        {ex.primaryMuscle ? (MUSCLE_LABEL[ex.primaryMuscle] ?? ex.primaryMuscle) : "—"}
                        {ex.equipment ? ` · ${ex.equipment}` : ""}
                      </div>
                    </div>
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
