"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, ConfirmModal, Icon, Input, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { WorkoutTemplateDetail } from "@regen/types";

const GROUP_COLORS: Record<string, string> = {
  A: "var(--lime)",
  B: "#7AB8FF",
  C: "#FFB547",
  D: "#FF8B8B",
  E: "#C084FC",
  F: "#6EE7B7",
};
const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F"];

function groupLabel(size: number) {
  if (size === 2) return "Biserie";
  if (size === 3) return "Triserie";
  return "Circuito";
}

interface WE {
  id: string;
  sortOrder: number;
  supersetGroup: string | null;
  isWarmup: boolean;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null; thumbnailUrl?: string | null; youtubeUrl?: string | null; isSystem?: boolean };
  targetSets: number | null;
  targetReps: string | null;
  durationSeconds: number | null;
  intensityType: string | null;
  intensityTarget: string | null;
  restSeconds: number | null;
  notes: string | null;
  groupNote: string | null;
  alternativesCount?: number;
}

interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
}

interface AltItem {
  id: string;
  priority: number;
  note: string | null;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null };
}

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", legs: "Piernas",
  glutes: "Glúteos", core: "Core", calves: "Pantorrillas",
  forearms: "Antebrazos", full_body: "Cuerpo completo",
};

// ─── Exercise picker modal ────────────────────────────────────────────────────

function ExercisePicker({ templateId, defaultWarmup, onAdd, onClose }: {
  templateId: string;
  defaultWarmup: boolean;
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
      const we = await api.post<WE>(`/coach/workouts/${templateId}/exercises`, { exerciseId: ex.id, isWarmup: asWarmup });
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
      const we = await api.post<WE>(`/coach/workouts/${templateId}/exercises`, { exerciseId: ex.id, isWarmup: asWarmup });
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
                <div style={{ marginBottom: 12 }}>Sin resultados para “{search}”</div>
                <button onClick={() => { setCreating(true); setNewName(search); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Crear “{search}”
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

// ─── Alternatives sub-panel ───────────────────────────────────────────────────

function AlternativesPanel({ weId, templateId }: { weId: string; templateId: string }) {
  const { api } = useAuth();
  const [alts, setAlts] = useState<AltItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ExerciseOption[] | null>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<AltItem[]>(`/coach/workouts/${templateId}/exercises/${weId}/alternatives`)
      .then(setAlts)
      .catch((e) => { console.error(e); setAlts([]); });
  }, [api, weId, templateId]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    api.get<ExerciseOption[]>(`/coach/exercises?q=${encodeURIComponent(q)}`)
      .then(setOptions)
      .catch((e) => { console.error(e); setOptions([]); });
  }, [api, search]);

  async function addAlt(ex: ExerciseOption) {
    setAdding(ex.id);
    try {
      const alt = await api.post<AltItem>(`/coach/workouts/${templateId}/exercises/${weId}/alternatives`, { exerciseId: ex.id });
      setAlts((p) => (p ? [...p, alt] : [alt]));
      setSearch("");
      setOptions([]);
    } catch (e) { console.error(e); }
    finally { setAdding(null); }
  }

  async function removeAlt(altId: string) {
    setDeletingId(altId);
    try {
      await api.del(`/coach/workouts/${templateId}/exercises/${weId}/alternatives/${altId}`);
      setAlts((p) => (p ? p.filter((a) => a.id !== altId) : p));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  }

  return (
    <div>
      {alts === null ? (
        <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "4px 0" }}>Cargando…</div>
      ) : (
        <>
          {alts.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>Sin alternativas configuradas.</div>
          )}
          {alts.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={13} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.exercise.name}</div>
                {a.exercise.primaryMuscle && (
                  <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 1 }}>
                    {(MUSCLE_LABEL[a.exercise.primaryMuscle] ?? a.exercise.primaryMuscle).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeAlt(a.id)}
                disabled={deletingId === a.id}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: deletingId === a.id ? 0.3 : 1 }}
              >
                <Icon name="trash" size={12} color="var(--text-dim)" />
              </button>
            </div>
          ))}
          {alts.length < 5 && (
            <div style={{ marginTop: 6, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px" }}>
                <Icon name="search" size={12} color="var(--text-mute)" />
                <input
                  value={search}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSearch(next);
                    setOptions(next.trim() ? null : []);
                  }}
                  placeholder="Agregar alternativa…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text)" }}
                />
                {options === null && !!search.trim() && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>…</span>}
              </div>
              {options !== null && options.length > 0 && (
                <div style={{ position: "absolute", top: 34, left: 0, right: 0, zIndex: 50, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 8, maxHeight: 180, overflowY: "auto", boxShadow: "0 6px 20px rgba(0,0,0,.3)" }}>
                  {options.slice(0, 6).map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => addAlt(opt)}
                      style={{ padding: "8px 12px", fontSize: 13, cursor: adding === opt.id ? "wait" : "pointer", opacity: adding === opt.id ? 0.5 : 1, display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--line)" }}
                      className="ta-row"
                    >
                      <span style={{ flex: 1, fontWeight: 500 }}>{opt.name}</span>
                      {opt.primaryMuscle && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{MUSCLE_LABEL[opt.primaryMuscle] ?? opt.primaryMuscle}</span>}
                      <Icon name="plus" size={12} color="var(--text-mute)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Exercise row (display-only, click to select) ─────────────────────────────

function ExerciseRow({ we, selected, onSelect, onMoveUp, onMoveDown, onDelete }: {
  we: WE;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: (() => void) | null;
  onMoveDown: (() => void) | null;
  onDelete: () => void;
}) {
  const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const muscleLabel = we.exercise.primaryMuscle ? (MUSCLE_LABEL[we.exercise.primaryMuscle] ?? we.exercise.primaryMuscle) : null;

  return (
    <>
      <div
        onClick={onSelect}
        style={{
          display: "grid",
          gridTemplateColumns: "20px 44px 1fr auto auto auto auto 68px",
          gap: 10, alignItems: "center",
          padding: "9px 14px",
          borderBottom: "1px solid var(--line)",
          borderLeft: selected ? "3px solid var(--lime)" : gc ? `3px solid ${gc}40` : "3px solid transparent",
          background: selected ? "rgba(215,255,58,.04)" : "transparent",
          cursor: "pointer",
          paddingLeft: selected || gc ? 11 : 14,
        }}
      >
        {/* Sort arrows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp ?? undefined} disabled={!onMoveUp}
            style={{ background: "none", border: "none", cursor: onMoveUp ? "pointer" : "default", padding: "2px 3px", opacity: onMoveUp ? 0.7 : 0.15, lineHeight: 1 }}>
            <Icon name="chevUp" size={10} color="var(--text-mute)" />
          </button>
          <button onClick={onMoveDown ?? undefined} disabled={!onMoveDown}
            style={{ background: "none", border: "none", cursor: onMoveDown ? "pointer" : "default", padding: "2px 3px", opacity: onMoveDown ? 0.7 : 0.15, lineHeight: 1 }}>
            <Icon name="chevD" size={10} color="var(--text-mute)" />
          </button>
        </div>

        {/* Thumbnail */}
        <div style={{ position: "relative", width: 44, height: 44, borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {we.exercise.thumbnailUrl ? (
            <Image unoptimized src={we.exercise.thumbnailUrl} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
          ) : (
            <Icon name="dumbbell" size={18} color="var(--text-mute)" />
          )}
          {gc && (
            <div style={{ position: "absolute", top: 2, left: 2, width: 14, height: 14, borderRadius: 3, background: gc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#0B0B0C", fontFamily: "var(--font-mono)" }}>
              {we.supersetGroup}
            </div>
          )}
        </div>

        {/* Name + muscle */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{we.exercise.name}</div>
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
            {muscleLabel ? muscleLabel.toUpperCase() : "—"}
            {we.isWarmup && <span style={{ color: "var(--warn)", marginLeft: 6 }}>· CALENT.</span>}
          </div>
        </div>

        {/* Sets × reps */}
        <div className="ta-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
          {we.targetSets && we.targetReps ? `${we.targetSets} × ${we.targetReps}` : we.targetSets ? `${we.targetSets} ×` : "—"}
        </div>

        {/* Intensity */}
        <div className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-text)", whiteSpace: "nowrap" }}>
          {we.intensityTarget ? `${we.intensityType?.toUpperCase() ?? ""} ${we.intensityTarget}`.trim() : "—"}
        </div>

        {/* Rest */}
        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", whiteSpace: "nowrap" }}>
          {we.restSeconds ? `${we.restSeconds}s` : "—"}
        </div>

        {/* Alternatives badge */}
        <div>
          {(we.alternativesCount ?? 0) > 0 ? (
            <span style={{ padding: "2px 6px", borderRadius: 5, background: "rgba(122,184,255,.15)", border: "1px solid rgba(122,184,255,.3)", fontSize: 9, fontWeight: 700, color: "#7AB8FF", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {we.alternativesCount} alt
            </span>
          ) : (
            <span style={{ fontSize: 9, color: "var(--bg-3)", fontFamily: "var(--font-mono)" }}>—</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onSelect}
            title="Editar"
            style={{ width: 28, height: 28, borderRadius: 7, background: selected ? "var(--lime)" : "transparent", border: `1px solid ${selected ? "var(--lime)" : "var(--line-2)"}`, color: selected ? "#0B0B0C" : "var(--text-mute)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="edit" size={12} color={selected ? "#0B0B0C" : "var(--text-mute)"} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Eliminar"
            style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid var(--line-2)", color: "var(--text-mute)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="trash" size={12} color="var(--text-mute)" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`¿Eliminar "${we.exercise.name}" de este workout?`}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

// ─── Exercise inspector panel ─────────────────────────────────────────────────

function ExerciseInspector({ we, templateId, usedGroups, groupSizes, nextGroup, onUpdate, onSetGroup, onToggleWarmup, onClose }: {
  we: WE;
  templateId: string;
  usedGroups: string[];
  groupSizes: Record<string, number>;
  nextGroup: string;
  onUpdate: (patch: Partial<WE>) => void;
  onSetGroup: (group: string | null) => void;
  onToggleWarmup: () => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [localSets, setLocalSets] = useState(String(we.targetSets ?? ""));
  const [localReps, setLocalReps] = useState(we.targetReps ?? "");
  const [localDuration, setLocalDuration] = useState(String(we.durationSeconds ?? ""));
  const [localIntType, setLocalIntType] = useState<"rpe" | "rir" | "">(
    (we.intensityType?.toLowerCase() as "rpe" | "rir") ?? ""
  );
  const [localIntVal, setLocalIntVal] = useState(we.intensityTarget ?? "");
  const [localRest, setLocalRest] = useState(String(we.restSeconds ?? ""));
  const [localNotes, setLocalNotes] = useState(we.notes ?? "");
  const [localGroupNote, setLocalGroupNote] = useState(we.groupNote ?? "");
  const [localYoutubeUrl, setLocalYoutubeUrl] = useState(we.exercise.youtubeUrl ?? "");

  // Sync if a different exercise is selected
  const prevId = useRef(we.id);
  useEffect(() => {
    if (prevId.current === we.id) return;
    prevId.current = we.id;
    setLocalSets(String(we.targetSets ?? ""));
    setLocalReps(we.targetReps ?? "");
    setLocalDuration(String(we.durationSeconds ?? ""));
    setLocalIntType((we.intensityType?.toLowerCase() as "rpe" | "rir") ?? "");
    setLocalIntVal(we.intensityTarget ?? "");
    setLocalRest(String(we.restSeconds ?? ""));
    setLocalNotes(we.notes ?? "");
    setLocalGroupNote(we.groupNote ?? "");
    setLocalYoutubeUrl(we.exercise.youtubeUrl ?? "");
  }, [we]);

  async function save(patch: Record<string, unknown>) {
    onUpdate(patch as Partial<WE>);
    try {
      await api.patch(`/coach/workouts/${templateId}/exercises/${we.id}`, patch);
    } catch (e) {
      console.error(e);
    }
  }

  function commitSets() {
    const n = parseInt(localSets);
    if (!isNaN(n) && n > 0) save({ targetSets: n });
  }

  function commitReps() {
    save({ targetReps: localReps || null });
  }

  function commitDuration() {
    const n = parseInt(localDuration);
    if (!isNaN(n) && n > 0) save({ durationSeconds: n });
    else if (!localDuration) save({ durationSeconds: null });
  }

  function commitInt() {
    if (localIntType && localIntVal) {
      save({ intensityType: localIntType, intensityTarget: localIntVal });
    } else if (!localIntVal) {
      save({ intensityType: null, intensityTarget: null });
    }
  }

  function commitRest() {
    const n = parseInt(localRest);
    if (!isNaN(n) && n > 0) save({ restSeconds: n });
    else if (!localRest) save({ restSeconds: null });
  }

  function commitNotes() {
    save({ notes: localNotes || null });
  }

  function commitGroupNote() {
    const trimmed = localGroupNote.trim().slice(0, 100);
    if (trimmed !== localGroupNote) setLocalGroupNote(trimmed);
    save({ groupNote: trimmed || null });
  }

  async function commitYoutubeUrl() {
    try {
      await api.patch(`/coach/exercises/${we.exercise.id}`, { youtubeUrl: localYoutubeUrl.trim() || null });
      onUpdate({ exercise: { ...we.exercise, youtubeUrl: localYoutubeUrl.trim() || null } });
    } catch (e) { console.error(e); }
  }

  const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
  const groupmates = we.supersetGroup
    ? `Grupo ${we.supersetGroup} · ${groupLabel(groupSizes[we.supersetGroup] ?? 1)}`
    : null;

  const allGroupOptions: (string | null)[] = [null, ...GROUP_LETTERS.slice(0, Math.max(usedGroups.length + 1, 1))];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 3 }}>EDITAR EJERCICIO</div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{we.exercise.name}</div>
          {we.exercise.primaryMuscle && (
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
              {MUSCLE_LABEL[we.exercise.primaryMuscle] ?? we.exercise.primaryMuscle}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mute)", flexShrink: 0 }}
        >
          <Icon name="x" size={13} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Group selector */}
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>SUPERSET / GRUPO</div>
          <div style={{ display: "flex", gap: 4 }}>
            {allGroupOptions.map((g) => {
              const gColor = g ? (GROUP_COLORS[g] ?? "var(--text-mute)") : null;
              const sel = we.supersetGroup === g;
              return (
                <button
                  key={g ?? "none"}
                  onClick={() => onSetGroup(g)}
                  style={{
                    flex: 1, height: 36, borderRadius: 8,
                    background: sel ? (gColor ?? "var(--bg-3)") : "var(--bg-2)",
                    border: `1px solid ${sel ? (gColor ?? "var(--line)") : "var(--line-2)"}`,
                    color: sel ? (g ? "#0B0B0C" : "var(--text)") : (g ? (gColor ?? "var(--text-mute)") : "var(--text-mute)"),
                    fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {g ?? "—"}
                </button>
              );
            })}
          </div>
          {groupmates && (
            <div style={{ fontSize: 11, color: gc ?? "var(--text-mute)", marginTop: 6 }}>{groupmates}</div>
          )}
        </div>

        {/* Warmup toggle */}
        <div
          onClick={onToggleWarmup}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer" }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Marcar como calentamiento</div>
            <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>Va en la fase 1, sin tracking de RPE</div>
          </div>
          {/* Toggle switch */}
          <div style={{
            width: 36, height: 22, borderRadius: 11,
            background: we.isWarmup ? "var(--lime)" : "var(--bg-3)",
            border: `1px solid ${we.isWarmup ? "var(--lime)" : "var(--line-2)"}`,
            position: "relative", transition: "background .15s", flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: we.isWarmup ? 16 : 2,
              width: 16, height: 16, borderRadius: 8,
              background: we.isWarmup ? "#0B0B0C" : "var(--text-mute)",
              transition: "left .15s",
            }} />
          </div>
        </div>

        {/* Targets */}
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>OBJETIVO</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Series</span>
              <input
                type="number" value={localSets}
                onChange={(e) => setLocalSets(e.target.value)}
                onBlur={commitSets}
                placeholder="3"
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>
                {localDuration ? "Duración (seg)" : "Reps"}
              </span>
              {localDuration ? (
                <input
                  type="number" value={localDuration}
                  onChange={(e) => setLocalDuration(e.target.value)}
                  onBlur={commitDuration}
                  placeholder="30"
                  style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--lime)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--lime)", outline: "none", textAlign: "center", width: "100%" }}
                />
              ) : (
                <input
                  value={localReps}
                  onChange={(e) => setLocalReps(e.target.value)}
                  onBlur={commitReps}
                  placeholder="8-12"
                  style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
                />
              )}
            </div>
          </div>
          {/* Toggle reps ↔ duración */}
          <button
            onClick={() => {
              if (localDuration) { setLocalDuration(""); save({ durationSeconds: null }); }
              else { setLocalReps(""); save({ targetReps: null, durationSeconds: null }); setLocalDuration("30"); }
            }}
            style={{
              marginTop: 4, padding: "5px 10px", borderRadius: 7,
              border: `1px solid ${localDuration ? "var(--lime)" : "var(--line-2)"}`,
              background: "transparent",
              color: localDuration ? "var(--lime)" : "var(--text-mute)",
              fontSize: 11, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start",
            }}
          >
            {localDuration ? "⏱ Por tiempo · cambiar a reps" : "⏱ Cambiar a por tiempo"}
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, marginTop: 8, alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Tipo</span>
              <div style={{ display: "flex", padding: 3, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8 }}>
                {(["rpe", "rir", ""] as const).map((t) => (
                  <button
                    key={t || "none"}
                    onClick={() => { setLocalIntType(t); if (t !== localIntType) save({ intensityType: t || null, intensityTarget: localIntVal || null }); }}
                    style={{
                      padding: "5px 8px", borderRadius: 6,
                      background: localIntType === t ? "var(--bg-3)" : "transparent",
                      border: "none", color: localIntType === t ? "var(--text)" : "var(--text-mute)",
                      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t ? t.toUpperCase() : "—"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Valor</span>
              <input
                type="number" value={localIntVal}
                onChange={(e) => setLocalIntVal(e.target.value)}
                onBlur={commitInt}
                placeholder="8"
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Descanso (segundos)</span>
              <input
                type="number" value={localRest}
                onChange={(e) => setLocalRest(e.target.value)}
                onBlur={commitRest}
                placeholder="90"
                style={{ height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center", width: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Alternatives — surfaced early so coaches know they can set swap options */}
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 3 }}>EJERCICIO ALTERNATIVO</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>Si el equipo no está disponible el cliente puede cambiar al alternativo.</div>
          <AlternativesPanel weId={we.id} templateId={templateId} />
        </div>

        {/* Notes */}
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>NOTA TÉCNICA</div>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={commitNotes}
            placeholder="Ej: Bajar controlado 3 seg, mantener tensión…"
            rows={3}
            style={{
              width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)",
              borderRadius: 8, padding: "8px 10px", fontFamily: "var(--font-sans)",
              fontSize: 13, color: "var(--text)", lineHeight: 1.45,
              resize: "none", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Group note — only shown when in a superset */}
        {we.supersetGroup && (
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: gc ?? "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
              NOTA DEL BLOQUE {we.supersetGroup}
            </div>
            <textarea
              value={localGroupNote}
              onChange={(e) => setLocalGroupNote(e.target.value.slice(0, 100))}
              onBlur={commitGroupNote}
              placeholder="Nota visible al lado del título del bloque…"
              rows={2}
              maxLength={100}
              style={{
                width: "100%", background: "var(--bg-2)", border: `1px solid ${gc ?? "var(--line-2)"}`,
                borderRadius: 8, padding: "8px 10px", fontFamily: "var(--font-sans)",
                fontSize: 13, color: "var(--text)", lineHeight: 1.45,
                resize: "none", outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: "var(--text-dim)", textAlign: "right", marginTop: 2 }}>{localGroupNote.length}/100</div>
          </div>
        )}

        {/* YouTube URL */}
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>YOUTUBE URL</div>
          <input
            type="url"
            value={localYoutubeUrl}
            onChange={(e) => setLocalYoutubeUrl(e.target.value)}
            onBlur={commitYoutubeUrl}
            placeholder="https://youtube.com/watch?v=…"
            disabled={we.exercise.isSystem}
            title={we.exercise.isSystem ? "Los ejercicios del sistema no se pueden modificar" : undefined}
            style={{
              height: 36, width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)",
              borderRadius: 8, padding: "0 10px", fontSize: 12, color: "var(--text)",
              outline: "none", boxSizing: "border-box", opacity: we.exercise.isSystem ? 0.5 : 1,
            }}
          />
          {we.exercise.isSystem && (
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>Solo lectura — ejercicio del sistema</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Workout properties panel ─────────────────────────────────────────────────

function WorkoutProperties({ title, setTitle, description, setDescription, warmup, setWarmup, warmupMinutes, setWarmupMinutes, usedGroups, groupSizes }: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  warmup: string; setWarmup: (v: string) => void;
  warmupMinutes: string; setWarmupMinutes: (v: string) => void;
  usedGroups: string[];
  groupSizes: Record<string, number>;
}) {
  return (
    <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>PROPIEDADES</div>
      <Input label="Nombre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Músculo · grupo muscular" />

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Calentamiento</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number" min={1} max={60} value={warmupMinutes}
            onChange={(e) => setWarmupMinutes(e.target.value)}
            placeholder="—"
            style={{ width: 52, height: 34, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center" }}
          />
          <span style={{ fontSize: 13, color: "var(--text-mute)" }}>minutos</span>
        </div>
        <textarea
          value={warmup}
          onChange={(e) => setWarmup(e.target.value)}
          placeholder="Instrucciones generales de calentamiento…"
          rows={3}
          style={{ background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.5, resize: "vertical", outline: "none", width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {usedGroups.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Grupos</span>
          {usedGroups.map((g) => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: GROUP_COLORS[g] ?? "var(--bg-3)", flexShrink: 0 }} />
              <span style={{ color: GROUP_COLORS[g] ?? "var(--text-mute)", fontWeight: 600 }}>Grupo {g}</span>
              <span style={{ color: "var(--text-mute)" }}>— {groupLabel(groupSizes[g] ?? 1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count, accent, right }: { label: string; count: number; accent: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "var(--bg-2)", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${accent}` }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</span>
      <span style={{ fontSize: 10, color: "var(--text-dim)" }}>· {count}</span>
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplateEditorPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { workoutTemplateId } = useParams<{ workoutTemplateId: string }>();
  const [data, setData] = useState<WorkoutTemplateDetail | null>(null);
  const [exercises, setExercises] = useState<WE[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [warmup, setWarmup] = useState("");
  const [warmupMinutes, setWarmupMinutes] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerWarmup, setPickerWarmup] = useState(false);
  const [selectedWeId, setSelectedWeId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<WorkoutTemplateDetail>(`/coach/workouts/${workoutTemplateId}`)
      .then((d) => {
        setData(d);
        setExercises(d.exercises as WE[]);
        setTitle(d.title);
        setDescription(d.description ?? "");
        setWarmup(d.warmupNotes ?? "");
        setWarmupMinutes(d.warmupMinutes ? String(d.warmupMinutes) : "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, workoutTemplateId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const wm = parseInt(warmupMinutes);
      await api.patch(`/coach/workouts/${workoutTemplateId}`, {
        title,
        description,
        warmupNotes: warmup || null,
        warmupMinutes: !isNaN(wm) && wm > 0 ? wm : null,
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

  function updateExercise(id: string, patch: Partial<WE>) {
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));
  }

  function moveExerciseInSection(id: string, direction: "up" | "down") {
    setExercises((prev) => {
      const we = prev.find((e) => e.id === id)!;
      const section = prev.filter((e) => e.isWarmup === we.isWarmup);
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

  async function toggleWarmup(id: string) {
    const we = exercises.find((e) => e.id === id)!;
    const newVal = !we.isWarmup;
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isWarmup: newVal, supersetGroup: null } : e));
    try {
      await api.patch(`/coach/workouts/${workoutTemplateId}/exercises/${id}`, { isWarmup: newVal, supersetGroup: null });
    } catch (e) {
      console.error(e);
      setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isWarmup: !newVal } : e));
    }
  }

  async function deleteExercise(id: string) {
    try {
      await api.del(`/coach/workouts/${workoutTemplateId}/exercises/${id}`);
      setExercises((prev) => prev.filter((e) => e.id !== id));
      if (selectedWeId === id) setSelectedWeId(null);
    } catch (e) { console.error(e); }
  }

  const usedGroups = [...new Set(exercises.filter(e => !e.isWarmup).map((e) => e.supersetGroup).filter(Boolean) as string[])].sort();
  const nextGroup = GROUP_LETTERS.find((l) => !usedGroups.includes(l)) ?? "A";
  const groupSizes: Record<string, number> = {};
  const groupFirstIdx: Record<string, number> = {};
  exercises.forEach((we, idx) => {
    if (!we.isWarmup && we.supersetGroup) {
      groupSizes[we.supersetGroup] = (groupSizes[we.supersetGroup] ?? 0) + 1;
      if (groupFirstIdx[we.supersetGroup] === undefined) groupFirstIdx[we.supersetGroup] = idx;
    }
  });

  const warmupExercises = exercises.filter((e) => e.isWarmup);
  const workExercises = exercises.filter((e) => !e.isWarmup);
  const selectedWe = selectedWeId ? exercises.find((e) => e.id === selectedWeId) ?? null : null;

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
            <Button size="sm" icon="check" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "calc(100vh - 74px)" }}>

          {/* ── Exercise list ── */}
          <div style={{ overflow: "auto" }}>
            {/* Workout title */}
            <div style={{ padding: "20px 24px 12px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>{data.title}</div>
              {data.description && <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>{data.description}</div>}
              <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11, color: "var(--text-mute)" }}>
                <span>{exercises.length} ejercicios</span>
                {usedGroups.length > 0 && <><span>·</span><span>{usedGroups.length} grupo{usedGroups.length > 1 ? "s" : ""}</span></>}
              </div>
            </div>

            {/* Table */}
            <div style={{ margin: "0 24px 24px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>

              {/* Warmup section */}
              {warmupExercises.length > 0 && (
                <>
                  <SectionLabel label="Calentamiento" count={warmupExercises.length} accent="var(--warn)" />
                  {warmupExercises.map((we) => {
                    const section = warmupExercises;
                    const secIdx = section.findIndex((e) => e.id === we.id);
                    return (
                      <ExerciseRow
                        key={we.id}
                        we={we}
                        selected={selectedWeId === we.id}
                        onSelect={() => setSelectedWeId((id) => id === we.id ? null : we.id)}
                        onMoveUp={secIdx > 0 ? () => moveExerciseInSection(we.id, "up") : null}
                        onMoveDown={secIdx < section.length - 1 ? () => moveExerciseInSection(we.id, "down") : null}
                        onDelete={() => deleteExercise(we.id)}
                      />
                    );
                  })}
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--line)", display: "flex" }}>
                    <Button variant="ghost" size="sm" icon="plus" onClick={() => { setPickerWarmup(true); setShowPicker(true); }}>
                      Ejercicio de calentamiento
                    </Button>
                  </div>
                </>
              )}

              {/* Work section */}
              {(workExercises.length > 0 || warmupExercises.length > 0) && (
                <SectionLabel label="Trabajo" count={workExercises.length} accent="var(--text-dim)" />
              )}

              {workExercises.map((we) => {
                const section = workExercises;
                const secIdx = section.findIndex((e) => e.id === we.id);
                const isGroupStart = we.supersetGroup !== null && groupFirstIdx[we.supersetGroup] === exercises.findIndex(e => e.id === we.id);
                const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;

                return (
                  <div key={we.id}>
                    {isGroupStart && we.supersetGroup && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px 3px 17px", background: "var(--bg-2)", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${gc}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: gc ?? "transparent" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em" }}>
                          {groupLabel(groupSizes[we.supersetGroup] ?? 1)} {we.supersetGroup}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 4 }}>
                          · {groupSizes[we.supersetGroup] ?? 1} ejercicios
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
                      selected={selectedWeId === we.id}
                      onSelect={() => setSelectedWeId((id) => id === we.id ? null : we.id)}
                      onMoveUp={secIdx > 0 ? () => moveExerciseInSection(we.id, "up") : null}
                      onMoveDown={secIdx < section.length - 1 ? () => moveExerciseInSection(we.id, "down") : null}
                      onDelete={() => deleteExercise(we.id)}
                    />
                  </div>
                );
              })}

              {exercises.length === 0 && (
                <div style={{ padding: "20px 14px", color: "var(--text-mute)", fontSize: 13 }}>
                  Sin ejercicios. Añadí el primero con el botón de abajo.
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: 10, borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "center" }}>
                <Button variant="ghost" size="sm" icon="plus" onClick={() => { setPickerWarmup(false); setShowPicker(true); }}>
                  Ejercicio de trabajo
                </Button>
                {warmupExercises.length === 0 && (
                  <Button variant="ghost" size="sm" icon="plus" onClick={() => { setPickerWarmup(true); setShowPicker(true); }}>
                    Ejercicio de calentamiento
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right panel: inspector or properties ── */}
          <div style={{ background: "var(--bg-1)", borderLeft: "1px solid var(--line)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {selectedWe ? (
              <ExerciseInspector
                we={selectedWe}
                templateId={workoutTemplateId}
                usedGroups={usedGroups}
                groupSizes={groupSizes}
                nextGroup={nextGroup}
                onUpdate={(patch) => updateExercise(selectedWe.id, patch)}
                onSetGroup={(group) => setExerciseGroup(selectedWe.id, group)}
                onToggleWarmup={() => toggleWarmup(selectedWe.id)}
                onClose={() => setSelectedWeId(null)}
              />
            ) : (
              <WorkoutProperties
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                warmup={warmup}
                setWarmup={setWarmup}
                warmupMinutes={warmupMinutes}
                setWarmupMinutes={setWarmupMinutes}
                usedGroups={usedGroups}
                groupSizes={groupSizes}
              />
            )}
          </div>
        </div>
      </DesktopShell>

      {showPicker && (
        <ExercisePicker
          templateId={workoutTemplateId}
          defaultWarmup={pickerWarmup}
          onAdd={(we) => setExercises((prev) => [...prev, { ...we, supersetGroup: null, isWarmup: we.isWarmup ?? false }])}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
