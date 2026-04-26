"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, ConfirmModal, Icon, Input, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { WorkoutTemplateDetail } from "@regen/types";

type IntensityLabel = "Baja" | "Media" | "Alta";
const INTENSITY_VALS: IntensityLabel[] = ["Baja", "Media", "Alta"];

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
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null };
  targetSets: number | null;
  targetReps: string | null;
  intensityType: string | null;
  intensityTarget: string | null;
  restSeconds: number | null;
  notes: string | null;
}

interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
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
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [asWarmup, setAsWarmup] = useState(defaultWarmup);

  useEffect(() => {
    setLoading(true);
    const q = search.trim();
    api.get<ExerciseOption[]>(`/coach/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setExercises)
      .catch(console.error)
      .finally(() => setLoading(false));
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

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, maxHeight: "80vh",
          background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Agregar ejercicio</div>

          {/* Warmup toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button
              onClick={() => setAsWarmup(false)}
              style={{
                flex: 1, height: 32, borderRadius: 8, border: `1.5px solid ${!asWarmup ? "var(--line)" : "var(--line-2)"}`,
                background: !asWarmup ? "var(--bg-2)" : "transparent",
                color: !asWarmup ? "var(--text)" : "var(--text-mute)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Ejercicio de trabajo
            </button>
            <button
              onClick={() => setAsWarmup(true)}
              style={{
                flex: 1, height: 32, borderRadius: 8, border: `1.5px solid ${asWarmup ? "var(--lime)" : "var(--line-2)"}`,
                background: asWarmup ? "rgba(132,204,22,.12)" : "transparent",
                color: asWarmup ? "var(--lime)" : "var(--text-mute)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Calentamiento
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ejercicio…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
          ) : exercises.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Sin resultados</div>
          ) : exercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => handleAdd(ex)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 20px",
                borderBottom: "1px solid var(--line)",
                cursor: adding === ex.id ? "wait" : "pointer",
                opacity: adding === ex.id ? 0.5 : 1,
              }}
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
        </div>
      </div>
    </div>
  );
}

// ─── Group badge with dropdown ─────────────────────────────────────────────────

function GroupBadge({ we, existingGroups, nextGroup, onSetGroup }: {
  we: WE;
  existingGroups: string[];
  nextGroup: string;
  onSetGroup: (group: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const color = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? "var(--text-mute)") : null;
  const targetGroups = existingGroups.filter(g => g !== we.supersetGroup);

  return (
    <div style={{ position: "relative" }}>
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />}
      <div
        onClick={() => setOpen((v) => !v)}
        title={we.supersetGroup ? `Grupo ${we.supersetGroup}` : "Asignar a grupo"}
        style={{
          width: 20, height: 20, borderRadius: 5, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: color ?? "transparent",
          border: color ? "none" : "1.5px dashed var(--line-2)",
          fontSize: 10, fontWeight: 800, color: "#0B0B0C",
          flexShrink: 0,
        }}
        className="ta-group-badge"
      >
        {we.supersetGroup ?? <span style={{ color: "var(--text-dim)", fontSize: 12, lineHeight: 1 }}>+</span>}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: 24, left: 0, zIndex: 99,
          background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 10, padding: "4px 0", minWidth: 160,
          boxShadow: "0 6px 20px rgba(0,0,0,.35)",
        }}>
          {targetGroups.map((g) => (
            <div key={g} onClick={() => { onSetGroup(g); setOpen(false); }}
              style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              className="ta-row"
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: GROUP_COLORS[g] ?? "var(--bg-3)", flexShrink: 0 }} />
              Mover a Grupo {g}
            </div>
          ))}
          {(!existingGroups.includes(nextGroup) || !we.supersetGroup) && (
            <div onClick={() => { onSetGroup(nextGroup); setOpen(false); }}
              style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              className="ta-row"
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: GROUP_COLORS[nextGroup] ?? "var(--bg-3)", flexShrink: 0 }} />
              + Nuevo Grupo {nextGroup}
            </div>
          )}
          {we.supersetGroup && (
            <>
              <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
              <div onClick={() => { onSetGroup(null); setOpen(false); }}
                style={{ padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "var(--text-mute)" }}
                className="ta-row"
              >
                Quitar del grupo
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Alternatives panel ───────────────────────────────────────────────────────

interface AltItem {
  id: string;
  priority: number;
  note: string | null;
  exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null };
}

function AlternativesPanel({ weId, templateId }: { weId: string; templateId: string }) {
  const { api } = useAuth();
  const [alts, setAlts] = useState<AltItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get<AltItem[]>(`/coach/workouts/${templateId}/exercises/${weId}/alternatives`)
      .then(setAlts).catch(console.error).finally(() => setLoading(false));
  }, [api, weId, templateId]);

  useEffect(() => {
    if (!search.trim()) { setOptions([]); return; }
    setSearching(true);
    api.get<ExerciseOption[]>(`/coach/exercises?q=${encodeURIComponent(search.trim())}`)
      .then(setOptions).catch(console.error).finally(() => setSearching(false));
  }, [api, search]);

  async function addAlt(ex: ExerciseOption) {
    setAdding(ex.id);
    try {
      const alt = await api.post<AltItem>(`/coach/workouts/${templateId}/exercises/${weId}/alternatives`, { exerciseId: ex.id });
      setAlts((p) => [...p, alt]);
      setSearch("");
      setOptions([]);
    } catch (e) { console.error(e); }
    finally { setAdding(null); }
  }

  async function removeAlt(altId: string) {
    setDeletingId(altId);
    try {
      await api.del(`/coach/workouts/${templateId}/exercises/${weId}/alternatives/${altId}`);
      setAlts((p) => p.filter((a) => a.id !== altId));
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  }

  return (
    <div style={{
      padding: "10px 14px 12px",
      background: "rgba(255,255,255,.02)",
      borderBottom: "1px solid var(--line)",
      borderLeft: "3px solid var(--bg-3)",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>
        Alternativas
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Cargando…</div>
      ) : (
        <>
          {alts.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>Sin alternativas. Buscá un ejercicio para agregar.</div>
          )}
          {alts.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-dim)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{a.exercise.name}</span>
              {a.exercise.primaryMuscle && (
                <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{MUSCLE_LABEL[a.exercise.primaryMuscle] ?? a.exercise.primaryMuscle}</span>
              )}
              <button
                onClick={() => removeAlt(a.id)}
                disabled={deletingId === a.id}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: deletingId === a.id ? 0.3 : 1 }}
              >
                <Icon name="x" size={12} color="var(--text-dim)" />
              </button>
            </div>
          ))}

          {alts.length < 5 && (
            <div style={{ marginTop: 8, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px" }}>
                <Icon name="search" size={12} color="var(--text-mute)" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Agregar alternativa…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text)" }}
                />
                {searching && <span style={{ fontSize: 10, color: "var(--text-dim)" }}>…</span>}
              </div>
              {options.length > 0 && (
                <div style={{
                  position: "absolute", top: 34, left: 0, right: 0, zIndex: 50,
                  background: "var(--bg-1)", border: "1px solid var(--line)",
                  borderRadius: 8, maxHeight: 180, overflowY: "auto",
                  boxShadow: "0 6px 20px rgba(0,0,0,.3)",
                }}>
                  {options.slice(0, 6).map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => addAlt(opt)}
                      style={{
                        padding: "8px 12px", fontSize: 13, cursor: adding === opt.id ? "wait" : "pointer",
                        opacity: adding === opt.id ? 0.5 : 1,
                        display: "flex", alignItems: "center", gap: 8,
                        borderBottom: "1px solid var(--line)",
                      }}
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

// ─── Editable exercise row ────────────────────────────────────────────────────

const GRID = "32px 22px 2.2fr 60px 90px 90px 80px 1fr 26px 32px";

function ExerciseRow({ we, templateId, onUpdate, onDelete, onMoveUp, onMoveDown,
  existingGroups, nextGroup, onSetGroup, onToggleWarmup }: {
  we: WE;
  templateId: string;
  onUpdate: (updated: Partial<WE>) => void;
  onDelete: () => void;
  onMoveUp: (() => void) | null;
  onMoveDown: (() => void) | null;
  existingGroups: string[];
  nextGroup: string;
  onSetGroup: (group: string | null) => void;
  onToggleWarmup: () => void;
}) {
  const { api } = useAuth();
  const groupColor = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
  const [altOpen, setAltOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  async function saveField(patch: Record<string, unknown>) {
    try {
      await api.patch(`/coach/workouts/${templateId}/exercises/${we.id}`, patch);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReorder(direction: "up" | "down") {
    if (direction === "up") { onMoveUp?.(); } else { onMoveDown?.(); }
    const newOrder = we.sortOrder + (direction === "up" ? -1.5 : 1.5);
    try {
      await api.patch(`/coach/workouts/${templateId}/exercises/${we.id}`, { sortOrder: newOrder });
    } catch (e) {
      console.error(e);
    }
  }

  function handleDelete() {
    setConfirmDialog({
      message: `¿Eliminar "${we.exercise.name}" de este workout?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api.del(`/coach/workouts/${templateId}/exercises/${we.id}`);
          onDelete();
        } catch (e) {
          console.error(e);
        }
      },
    });
  }

  const cellInput = (
    value: string,
    placeholder: string,
    onBlur: (val: string) => void,
    opts?: { numeric?: boolean; align?: "center" | "left" }
  ) => (
    <input
      defaultValue={value}
      placeholder={placeholder}
      type={opts?.numeric ? "number" : "text"}
      onBlur={(e) => onBlur(e.target.value)}
      style={{
        width: "100%", background: "transparent", border: "none", outline: "none",
        fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)",
        textAlign: opts?.align ?? "center", padding: 0,
      }}
    />
  );

  return (
    <>
    <div style={{
      display: "grid", gridTemplateColumns: GRID,
      padding: "8px 14px",
      borderBottom: altOpen ? "none" : "1px solid var(--line)",
      borderLeft: groupColor ? `3px solid ${groupColor}` : "3px solid transparent",
      alignItems: "center", gap: 8, fontSize: 13,
      paddingLeft: groupColor ? 11 : 14,
    }}>
      {/* Sort arrows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <button onClick={() => handleReorder("up")} disabled={!onMoveUp}
          style={{ background: "none", border: "none", cursor: onMoveUp ? "pointer" : "default", padding: "2px 4px", opacity: onMoveUp ? 1 : 0.2, lineHeight: 1 }}
          title="Subir">
          <Icon name="chevUp" size={10} color="var(--text-mute)" />
        </button>
        <button onClick={() => handleReorder("down")} disabled={!onMoveDown}
          style={{ background: "none", border: "none", cursor: onMoveDown ? "pointer" : "default", padding: "2px 4px", opacity: onMoveDown ? 1 : 0.2, lineHeight: 1 }}
          title="Bajar">
          <Icon name="chevD" size={10} color="var(--text-mute)" />
        </button>
      </div>

      {/* Group badge */}
      {!we.isWarmup ? (
        <GroupBadge we={we} existingGroups={existingGroups} nextGroup={nextGroup} onSetGroup={onSetGroup} />
      ) : (
        <div />
      )}

      {/* Exercise name + alt toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {we.exercise.name}
          {we.exercise.primaryMuscle && (
            <span style={{ fontSize: 11, color: "var(--text-mute)", marginLeft: 6 }}>
              {MUSCLE_LABEL[we.exercise.primaryMuscle] ?? we.exercise.primaryMuscle}
            </span>
          )}
        </div>
        <button
          onClick={() => setAltOpen((v) => !v)}
          title="Alternativas"
          style={{
            background: altOpen ? "var(--bg-3)" : "transparent",
            border: `1px solid ${altOpen ? "var(--line)" : "var(--line-2)"}`,
            borderRadius: 5, padding: "1px 5px", cursor: "pointer",
            fontSize: 9, fontWeight: 700, color: altOpen ? "var(--text)" : "var(--text-dim)",
            flexShrink: 0, letterSpacing: ".04em", textTransform: "uppercase",
          }}
        >
          Alt
        </button>
      </div>

      {/* Sets */}
      <div style={{ textAlign: "center" }}>
        {cellInput(String(we.targetSets ?? ""), "3", (v) => {
          const n = parseInt(v); if (!isNaN(n)) { onUpdate({ targetSets: n }); saveField({ targetSets: n }); }
        }, { numeric: true })}
      </div>

      {/* Reps */}
      <div>
        {cellInput(we.targetReps ?? "", "8-12", (v) => {
          onUpdate({ targetReps: v || null }); saveField({ targetReps: v });
        })}
      </div>

      {/* Effort */}
      <div>
        {cellInput(
          we.intensityTarget ? `${we.intensityType?.toUpperCase() ?? ""} ${we.intensityTarget}`.trim() : "",
          "RPE 8",
          (v) => {
            const match = v.trim().match(/^(rpe|rir)?\s*(\d+(\.\d+)?)$/i);
            if (match) {
              const type = match[1]?.toLowerCase() ?? "rpe";
              const target = match[2];
              onUpdate({ intensityType: type, intensityTarget: target });
              saveField({ intensityType: type, intensityTarget: Number(target) });
            } else if (!v.trim()) {
              onUpdate({ intensityType: null, intensityTarget: null });
              saveField({ intensityType: null, intensityTarget: null });
            }
          }
        )}
      </div>

      {/* Rest */}
      <div>
        {cellInput(we.restSeconds ? String(we.restSeconds) : "", "90s", (v) => {
          const n = parseInt(v); if (!isNaN(n)) { onUpdate({ restSeconds: n }); saveField({ restSeconds: n }); }
          else if (!v.trim()) { onUpdate({ restSeconds: null }); saveField({ restSeconds: null }); }
        }, { numeric: true })}
      </div>

      {/* Notes */}
      <div>
        {cellInput(we.notes ?? "", "Nota…", (v) => {
          onUpdate({ notes: v || null }); saveField({ notes: v });
        }, { align: "left" })}
      </div>

      {/* Warmup toggle */}
      <button
        onClick={onToggleWarmup}
        title={we.isWarmup ? "Mover a ejercicios de trabajo" : "Mover a calentamiento"}
        style={{
          background: we.isWarmup ? "rgba(132,204,22,.18)" : "transparent",
          border: `1.5px ${we.isWarmup ? "solid var(--lime)" : "dashed var(--line-2)"}`,
          borderRadius: 4, width: 22, height: 22, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 800, letterSpacing: 0,
          color: we.isWarmup ? "var(--lime)" : "var(--text-dim)",
          flexShrink: 0, padding: 0,
          transition: "all .15s",
        }}
      >
        C
      </button>

      {/* Delete */}
      <button onClick={handleDelete}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
        title="Eliminar ejercicio">
        <Icon name="trash" size={13} color="var(--text-dim)" />
      </button>
    </div>
    {altOpen && <AlternativesPanel weId={we.id} templateId={templateId} />}
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

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count, accent, right }: {
  label: string; count: number; accent: string; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 14px", background: "var(--bg-2)",
      borderBottom: "1px solid var(--line)",
      borderLeft: `3px solid ${accent}`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: ".1em" }}>
        {label}
      </span>
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
  const [intensity, setIntensity] = useState<IntensityLabel>("Media");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerWarmup, setPickerWarmup] = useState(false);

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
      const realSwapIdx = prev.findIndex((e) => e.id === section[swapSecIdx].id);
      const next = [...prev];
      [next[realIdx], next[realSwapIdx]] = [next[realSwapIdx], next[realIdx]];
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
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleWarmup(id: string) {
    const we = exercises.find((e) => e.id === id)!;
    const newVal = !we.isWarmup;
    // Clear supersetGroup when moving to/from warmup
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isWarmup: newVal, supersetGroup: null } : e));
    try {
      await api.patch(`/coach/workouts/${workoutTemplateId}/exercises/${id}`, { isWarmup: newVal, supersetGroup: null });
    } catch (e) {
      console.error(e);
      setExercises((prev) => prev.map((e) => e.id === id ? { ...e, isWarmup: !newVal } : e));
    }
  }

  // Group metadata (work section only)
  const usedGroups = [...new Set(exercises.filter(e => !e.isWarmup).map((e) => e.supersetGroup).filter(Boolean) as string[])].sort();
  const nextGroup = GROUP_LETTERS.find((l) => !usedGroups.includes(l)) ?? "A";
  const groupSizes: Record<string, number> = {};
  const groupFirstIdx: Record<string, number> = {};
  exercises.forEach((we, idx) => {
    if (!we.isWarmup && we.supersetGroup) {
      groupSizes[we.supersetGroup] = (groupSizes[we.supersetGroup] ?? 0) + 1;
      if (groupFirstIdx[we.supersetGroup] === undefined) {
        groupFirstIdx[we.supersetGroup] = idx;
      }
    }
  });

  const warmupExercises = exercises.filter((e) => e.isWarmup);
  const workExercises = exercises.filter((e) => !e.isWarmup);

  function openPicker(warmupMode: boolean) {
    setPickerWarmup(warmupMode);
    setShowPicker(true);
  }

  function renderRow(we: WE) {
    const section = we.isWarmup ? warmupExercises : workExercises;
    const secIdx = section.findIndex((e) => e.id === we.id);
    const canUp = secIdx > 0;
    const canDown = secIdx < section.length - 1;

    const isGroupStart = !we.isWarmup && we.supersetGroup !== null && groupFirstIdx[we.supersetGroup] === exercises.findIndex(e => e.id === we.id);
    const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;

    return (
      <div key={we.id}>
        {isGroupStart && we.supersetGroup && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 14px 3px 17px",
            background: "var(--bg-2)", borderBottom: "1px solid var(--line)",
            borderLeft: `3px solid ${gc}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: gc ?? "transparent", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em" }}>
              {groupLabel(groupSizes[we.supersetGroup] ?? 1)} {we.supersetGroup}
            </span>
            <div style={{ flex: 1, height: 1, background: gc ?? "var(--line)", opacity: 0.25 }} />
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>
              {groupSizes[we.supersetGroup] ?? 1} ejs · rest entre rondas
            </span>
          </div>
        )}
        <ExerciseRow
          we={we}
          templateId={workoutTemplateId}
          onUpdate={(patch) => updateExercise(we.id, patch)}
          onDelete={() => setExercises((prev) => prev.filter((e) => e.id !== we.id))}
          onMoveUp={canUp ? () => moveExerciseInSection(we.id, "up") : null}
          onMoveDown={canDown ? () => moveExerciseInSection(we.id, "down") : null}
          existingGroups={usedGroups}
          nextGroup={nextGroup}
          onSetGroup={(group) => setExerciseGroup(we.id, group)}
          onToggleWarmup={() => toggleWarmup(we.id)}
        />
      </div>
    );
  }

  if (loading) {
    return <DesktopShell active="templates" coachName={user?.name ?? "Coach"}><StateBlock kind="loading" title="Cargando entrenamiento…" /></DesktopShell>;
  }
  if (!data) {
    return <DesktopShell active="templates" coachName={user?.name ?? "Coach"}><StateBlock kind="error" title="Entrenamiento no encontrado" /></DesktopShell>;
  }

  const warmupMins = parseInt(warmupMinutes);
  const hasWarmupTime = !isNaN(warmupMins) && warmupMins > 0;

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
        subtitle={`${saved ? "✓ Guardado" : "editando"}`}
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", height: "calc(100vh - 74px)" }}>
          {/* Main editor */}
          <div style={{ padding: 24, overflow: "auto" }}>
            {/* Title + tags */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {data.tags.map((tag) => <Badge key={tag} tone="lime">{tag}</Badge>)}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>{data.title}</div>
              {data.description && <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>{data.description}</div>}
            </div>

            {/* Exercise table */}
            <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600, marginBottom: 10 }}>
              Ejercicios · {exercises.length}
            </div>
            <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: GRID,
                padding: "10px 14px", background: "var(--bg-2)", borderBottom: "1px solid var(--line)",
                fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase",
                letterSpacing: ".08em", fontWeight: 600, gap: 8,
              }}>
                <div />
                <div title="Biserie / Triserie / Circuito">Gr.</div>
                <div>Ejercicio</div>
                <div style={{ textAlign: "center" }}>Sets</div>
                <div style={{ textAlign: "center" }}>Reps</div>
                <div style={{ textAlign: "center" }}>Esfuerzo</div>
                <div style={{ textAlign: "center" }}>Rest</div>
                <div>Nota</div>
                <div title="Calentamiento" style={{ textAlign: "center" }}>C</div>
                <div />
              </div>

              {/* Warmup section */}
              {warmupExercises.length > 0 && (
                <>
                  <SectionHeader
                    label="Calentamiento"
                    count={warmupExercises.length}
                    accent="var(--lime)"
                    right={
                      hasWarmupTime ? (
                        <span style={{ fontSize: 11, color: "var(--lime)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                          {warmupMins} min
                        </span>
                      ) : undefined
                    }
                  />
                  {warmupExercises.map((we) => renderRow(we))}
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--line)", display: "flex" }}>
                    <Button variant="ghost" size="sm" icon="plus" onClick={() => openPicker(true)}>
                      Ejercicio de calentamiento
                    </Button>
                  </div>
                </>
              )}

              {/* Work section */}
              {(workExercises.length > 0 || warmupExercises.length > 0) && (
                <SectionHeader
                  label="Trabajo"
                  count={workExercises.length}
                  accent="var(--text-dim)"
                />
              )}
              {workExercises.map((we) => renderRow(we))}

              {exercises.length === 0 && (
                <div style={{ padding: "20px 14px", color: "var(--text-mute)", fontSize: 13 }}>
                  Sin ejercicios. Añadí el primero con el botón de abajo.
                </div>
              )}

              {/* Footer buttons */}
              <div style={{ padding: 10, borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "center" }}>
                <Button variant="ghost" size="sm" icon="plus" onClick={() => openPicker(false)}>
                  Ejercicio de trabajo
                </Button>
                {warmupExercises.length === 0 && (
                  <Button variant="ghost" size="sm" icon="plus" onClick={() => openPicker(true)}>
                    Ejercicio de calentamiento
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right inspector */}
          <div style={{ background: "var(--bg-1)", borderLeft: "1px solid var(--line)", padding: 20, overflow: "auto" }}>
            <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600, marginBottom: 12 }}>Propiedades</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="Nombre" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Músculo · grupo muscular" />

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 500, letterSpacing: ".02em", textTransform: "uppercase" }}>Intensidad</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {INTENSITY_VALS.map((v) => (
                    <button key={v} onClick={() => setIntensity(v)} style={{
                      flex: 1, height: 34, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: intensity === v ? "var(--lime)" : "var(--bg-2)",
                      color: intensity === v ? "#0B0B0C" : "var(--text-mute)",
                      border: `1px solid ${intensity === v ? "var(--lime)" : "var(--line-2)"}`,
                    }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warmup section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--bg-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "var(--lime)", fontWeight: 600, letterSpacing: ".02em", textTransform: "uppercase" }}>Calentamiento</span>
                  {warmupExercises.length > 0 && (
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{warmupExercises.length} ejercicios</span>
                  )}
                </div>

                {/* Duration */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={warmupMinutes}
                    onChange={(e) => setWarmupMinutes(e.target.value)}
                    placeholder="—"
                    style={{
                      width: 52, height: 34, background: "var(--bg-1)", border: "1px solid var(--line-2)",
                      borderRadius: 8, padding: "0 10px", fontFamily: "var(--font-mono)",
                      fontSize: 14, color: "var(--text)", outline: "none", textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "var(--text-mute)" }}>minutos de duración</span>
                </div>

                {/* Notes textarea */}
                <textarea
                  value={warmup}
                  onChange={(e) => setWarmup(e.target.value)}
                  placeholder="Instrucciones generales…"
                  rows={3}
                  style={{
                    background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8,
                    padding: "8px 10px", fontFamily: "var(--font-sans)", fontSize: 13,
                    color: "var(--text)", lineHeight: 1.5, resize: "vertical",
                    outline: "none", width: "100%", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Group legend */}
              {usedGroups.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 500, letterSpacing: ".02em", textTransform: "uppercase" }}>Grupos</span>
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
