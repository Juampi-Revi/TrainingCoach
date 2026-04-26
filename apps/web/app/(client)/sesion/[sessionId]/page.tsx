"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Icon, Progress, StateBlock, Tabs } from "@/components/ui";
import type { SessionDetail, SessionExercise, WorkoutSet } from "@regen/types";

type EffortMode = "RPE" | "RIR";

interface SetDraft {
  reps: string;
  kg: string;
  effort: string;
}

interface OfflineItem {
  wseId: string;
  setNumber: number;
  body: Record<string, string>;
}

interface ExerciseOption {
  id: string;
  name: string;
  primaryMuscle: string | null;
  thumbnailUrl: string | null;
}

const MUSCLE_LABEL: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", legs: "Piernas",
  glutes: "Glúteos", core: "Core", calves: "Pantorrillas",
  forearms: "Antebrazos", full_body: "Cuerpo completo",
};

const GROUP_COLORS: Record<string, string> = {
  A: "var(--lime)",
  B: "#7AB8FF",
  C: "#FFB547",
  D: "#FF8B8B",
  E: "#C084FC",
  F: "#6EE7B7",
};

function groupLabel(size: number) {
  if (size === 2) return "Biserie";
  if (size === 3) return "Triserie";
  return "Circuito";
}

// ─── Exercise picker ──────────────────────────────────────────────────────────

function ExercisePicker({
  sessionId, onAdd, onClose,
}: {
  sessionId: string;
  onAdd: (ex: SessionExercise) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = search.trim();
    api.get<ExerciseOption[]>(`/coach/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setOptions).catch(console.error).finally(() => setLoading(false));
  }, [api, search]);

  async function handleAdd(opt: ExerciseOption) {
    setAdding(opt.id);
    try {
      const wse = await api.post<SessionExercise>(`/client/sessions/${sessionId}/exercises`, { exerciseId: opt.id });
      onAdd(wse);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 540, maxHeight: "75dvh", background: "var(--bg-1)", borderRadius: "16px 16px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Agregar ejercicio</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }} />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
          ) : options.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Sin resultados</div>
          ) : options.map((opt) => (
            <div key={opt.id} onClick={() => handleAdd(opt)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)", cursor: adding === opt.id ? "wait" : "pointer", opacity: adding === opt.id ? 0.5 : 1 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={16} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.name}</div>
                {opt.primaryMuscle && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>{MUSCLE_LABEL[opt.primaryMuscle] ?? opt.primaryMuscle}</div>}
              </div>
              <Icon name="plus" size={16} color="var(--text-mute)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Media lightbox ──────────────────────────────────────────────────────────

function MediaLightbox({
  media,
  onClose,
}: {
  media: { id: string; url: string; mediaType: string }[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const m = media[idx] ?? media[0];
  if (!m) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.93)", zIndex: 1100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >×</button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 540, padding: "0 16px" }}
      >
        {m.mediaType === "video" ? (
          <video
            key={m.url}
            src={m.url}
            controls
            autoPlay
            style={{ width: "100%", borderRadius: 12, maxHeight: "70dvh" }}
          />
        ) : (
          <img
            src={m.url}
            alt=""
            style={{ width: "100%", borderRadius: 12, objectFit: "contain", maxHeight: "70dvh" }}
          />
        )}

        {media.length > 1 && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,.3)", border: "none", cursor: "pointer", padding: 0 }}
              />
            ))}
          </div>
        )}

        {media.length > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "0 8px" }}>
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 14, cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}
            >← Ant.</button>
            <button
              onClick={() => setIdx((i) => Math.min(media.length - 1, i + 1))}
              disabled={idx === media.length - 1}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 14, cursor: "pointer", opacity: idx === media.length - 1 ? 0.3 : 1 }}
            >Sig. →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Swap exercise sheet ──────────────────────────────────────────────────────

function SwapSheet({
  ex,
  sessionId,
  onSwapped,
  onClose,
}: {
  ex: SessionExercise;
  sessionId: string;
  onSwapped: () => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [swapping, setSwapping] = useState<string | null>(null);

  async function doSwap(altExerciseId: string) {
    setSwapping(altExerciseId);
    try {
      await api.patch(
        `/client/sessions/${sessionId}/exercises/${ex.id}`,
        { swapExerciseId: altExerciseId },
      );
      onSwapped();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSwapping(null);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "20px 16px 36px" }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Cambiar ejercicio</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 16 }}>
          Alternativas para <strong>{ex.exercise.name}</strong>
        </div>

        {ex.alternatives.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-mute)", textAlign: "center", padding: "24px 0" }}>
            El coach no configuró alternativas para este ejercicio.
          </div>
        ) : (
          ex.alternatives.map((alt) => (
            <button
              key={alt.exerciseId}
              onClick={() => doSwap(alt.exerciseId)}
              disabled={!!swapping}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 0", borderTop: "none", borderLeft: "none", borderRight: "none",
                borderBottom: "1px solid var(--line)",
                background: "none",
                cursor: swapping === alt.exerciseId ? "wait" : "pointer",
                opacity: swapping && swapping !== alt.exerciseId ? 0.4 : 1,
                textAlign: "left",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={16} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{alt.name}</div>
                {alt.primaryMuscle && (
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>
                    {MUSCLE_LABEL[alt.primaryMuscle] ?? alt.primaryMuscle}
                  </div>
                )}
              </div>
              {swapping === alt.exerciseId ? (
                <span style={{ fontSize: 12, color: "var(--text-mute)" }}>Cambiando…</span>
              ) : (
                <Icon name="chevR" size={14} color="var(--text-mute)" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Rest timer overlay ───────────────────────────────────────────────────────

function RestTimerOverlay({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : String(secs);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 900 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 600, marginBottom: 12 }}>Descansando</div>
        <div className="ta-mono" style={{ fontSize: 80, fontWeight: 700, color: seconds <= 10 ? "var(--warn)" : "var(--lime)", lineHeight: 1, letterSpacing: "-.04em" }}>
          {display}
        </div>
        <div style={{ marginTop: 28 }}>
          <Button variant="secondary" onClick={onSkip}>Saltear descanso</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionInProgressPage() {
  const { api } = useAuth();
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [effortMode, setEffortMode] = useState<EffortMode>("RPE");
  const [draft, setDraft] = useState<SetDraft>({ reps: "", kg: "", effort: "" });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [warmupDismissed, setWarmupDismissed] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [editingSet, setEditingSet] = useState<{ setNumber: number; reps: string; kg: string; effort: string } | null>(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const queueKey = `regen_offline_${sessionId}`;
  const apiRef = useRef(api);
  apiRef.current = api;

  const load = useCallback(() => {
    apiRef.current
      .get<SessionDetail>(`/client/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        setSessionNotes(s.sessionNotes ?? "");
        if (s.status === "completed") router.replace(`/sesion/${sessionId}/completada`);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  useEffect(() => { load(); }, [load]);

  // Rest timer countdown
  useEffect(() => {
    if (restSeconds == null || restSeconds <= 0) {
      if (restSeconds === 0) setRestSeconds(null);
      return;
    }
    const id = setTimeout(() => setRestSeconds((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [restSeconds]);

  // Offline queue
  useEffect(() => {
    try {
      const stored = localStorage.getItem(queueKey);
      if (stored) setOfflineCount(JSON.parse(stored).length);
    } catch {}
  }, [queueKey]);

  const flushQueue = useCallback(async () => {
    try {
      const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
      if (!queue.length) return;
      const remaining: OfflineItem[] = [];
      for (const item of queue) {
        try {
          await apiRef.current.put(
            `/client/sessions/${sessionId}/exercises/${item.wseId}/sets/${item.setNumber}`,
            item.body,
          );
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem(queueKey, JSON.stringify(remaining));
      setOfflineCount(remaining.length);
      if (remaining.length < queue.length) load();
    } catch {}
  }, [queueKey, sessionId, load]);

  useEffect(() => {
    flushQueue();
    window.addEventListener("online", flushQueue);
    return () => window.removeEventListener("online", flushQueue);
  }, [flushQueue]);

  // Keyboard awareness — adjust sticky bottom when virtual keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = window.innerHeight - (vv.height + vv.offsetTop);
      setKeyboardOffset(Math.max(0, offset));
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  async function logSet() {
    if (!session) return;
    const ex = session.exercises[currentExIdx];
    if (!ex) return;

    const body: Record<string, string> = { reps: draft.reps, weight: draft.kg };
    if (effortMode === "RPE") body.rpe = draft.effort;
    else body.rir = draft.effort;

    const nextSetNum = ex.sets.length + 1;

    if (!navigator.onLine) {
      try {
        const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
        queue.push({ wseId: ex.id, setNumber: nextSetNum, body });
        localStorage.setItem(queueKey, JSON.stringify(queue));
        setOfflineCount(queue.length);
      } catch {}
      setLastSaved("guardado offline");
      setDraft({ reps: "", kg: draft.kg, effort: "" });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${nextSetNum}`, body);
      setLastSaved(new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }));
      setDraft({ reps: "", kg: draft.kg, effort: "" });
      const rest = ex.target?.restSeconds ?? 90;
      setRestSeconds(rest);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function completeSession() {
    setCompleting(true);
    try {
      await api.patch(`/client/sessions/${sessionId}`, { status: "completed" });
      router.replace(`/sesion/${sessionId}/completada`);
    } catch (e) {
      console.error(e);
      setCompleting(false);
    }
  }

  function goToEx(i: number) {
    setCurrentExIdx(i);
    setDraft({ reps: "", kg: "", effort: "" });
    setEditingSet(null);
    setMediaOpen(false);
    setSwapOpen(false);
  }

  async function deleteSet(setNumber: number) {
    if (!ex) return;
    try {
      await api.del(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${setNumber}`);
      setEditingSet(null);
      load();
    } catch (e) { console.error(e); }
  }

  async function saveEditedSet() {
    if (!ex || !editingSet) return;
    const body: Record<string, string> = { reps: editingSet.reps, weight: editingSet.kg };
    if (effortMode === "RPE") body.rpe = editingSet.effort;
    else body.rir = editingSet.effort;
    try {
      await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${editingSet.setNumber}`, body);
      setEditingSet(null);
      load();
    } catch (e) { console.error(e); }
  }

  async function saveNotes(notes: string) {
    try {
      await api.patch(`/client/sessions/${sessionId}`, { sessionNotes: notes || null });
    } catch (e) { console.error(e); }
  }

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando sesión…" />
      </div>
    );
  }

  const ex: SessionExercise | undefined = session.exercises[currentExIdx];
  const completedExs = session.exercises.filter((e) => e.sets.length >= (e.target?.sets ?? 3)).length;

  // Warmup info
  const warmupExercises = session.exercises.filter((e) => e.isWarmup);
  const workExercises = session.exercises.filter((e) => !e.isWarmup);
  const warmupNotes = session.workoutTemplate?.warmupNotes;
  const warmupMinutes = session.workoutTemplate?.warmupMinutes;
  const hasWarmup = warmupExercises.length > 0 || !!warmupNotes || !!warmupMinutes;

  // Group metadata for work exercises
  const groupSizes: Record<string, number> = {};
  workExercises.forEach((e) => {
    if (e.supersetGroup) groupSizes[e.supersetGroup] = (groupSizes[e.supersetGroup] ?? 0) + 1;
  });

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>

      {/* ── Back button + title bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 0",
      }}>
        <button
          onClick={() => router.push("/semana")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-mute)", fontSize: 13, fontWeight: 600, padding: "4px 0",
          }}
        >
          <Icon name="chevL" size={14} color="var(--text-mute)" />
          Volver
        </button>
        {lastSaved && (
          <span style={{ fontSize: 11, color: "var(--success)" }}>✓ {lastSaved}</span>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: "6px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
            Progreso
          </span>
          <span style={{ fontSize: 11, color: completedExs === session.exercises.length ? "var(--success)" : "var(--text-mute)", fontWeight: 700 }} className="ta-mono">
            {completedExs}/{session.exercises.length}
          </span>
        </div>
        <Progress value={completedExs} total={session.exercises.length} height={5}
          color={completedExs === session.exercises.length ? "var(--success)" : "var(--lime)"} />
      </div>

      {/* ── Offline banner ── */}
      {offlineCount > 0 && (
        <div style={{
          background: "var(--warn)", color: "#0B0B0C",
          padding: "8px 16px", margin: "8px 16px 0", borderRadius: 8,
          fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Icon name="alert" size={13} color="#0B0B0C" />
          {offlineCount} serie{offlineCount !== 1 ? "s" : ""} pendiente{offlineCount !== 1 ? "s" : ""} · se sincronizarán al reconectar
          <button onClick={flushQueue} style={{ background: "rgba(0,0,0,.15)", border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#0B0B0C" }}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── Warmup card ── */}
      {hasWarmup && !warmupDismissed && (
        <div style={{
          margin: "10px 16px 0",
          padding: "12px 14px",
          background: "rgba(132,204,22,.07)",
          border: "1px solid rgba(132,204,22,.22)",
          borderLeft: "3px solid var(--lime)",
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "var(--lime)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
                Calentamiento{warmupMinutes ? ` · ${warmupMinutes} min` : ""}
              </div>
              {warmupNotes && (
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: warmupExercises.length > 0 ? 8 : 0 }}>
                  {warmupNotes}
                </div>
              )}
              {warmupExercises.map((we, i) => (
                <button
                  key={we.id}
                  onClick={() => goToEx(session.exercises.findIndex(e => e.id === we.id))}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "3px 0", textAlign: "left",
                  }}
                >
                  <span className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", fontWeight: 700, width: 18, flexShrink: 0 }}>C{i + 1}</span>
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{we.exercise.name}</span>
                  {we.target?.sets && we.target?.reps && (
                    <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 2 }}>{we.target.sets}×{we.target.reps}</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setWarmupDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
              <Icon name="x" size={14} color="var(--text-mute)" />
            </button>
          </div>
        </div>
      )}

      {/* ── Current exercise header ── */}
      <div style={{ padding: "14px 20px 4px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Thumbnail — clickable if media exists */}
        <div
          onClick={() => ex?.media?.length ? setMediaOpen(true) : undefined}
          style={{ position: "relative", flexShrink: 0, cursor: ex?.media?.length ? "pointer" : "default" }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {ex?.exercise.thumbnailUrl ? (
              <img src={ex.exercise.thumbnailUrl} alt={ex.exercise.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Icon name="dumbbell" size={20} color="var(--text-dim)" />
            )}
          </div>
          {ex?.media?.length ? (
            <div style={{ position: "absolute", bottom: -3, right: -3, background: "var(--lime)", color: "#0B0B0C", fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid var(--bg)" }}>
              {ex.media.length}
            </div>
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 2 }}>
            {session.workoutTemplate?.title ?? "Sesión"} · Ej {currentExIdx + 1}/{session.exercises.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>
            {ex?.exercise.name ?? "—"}
          </div>
          {/* Group label */}
          {ex?.supersetGroup && (
            <div style={{ fontSize: 11, color: GROUP_COLORS[ex.supersetGroup] ?? "var(--text-mute)", fontWeight: 600, marginTop: 2 }}>
              {groupLabel(groupSizes[ex.supersetGroup] ?? 1)} {ex.supersetGroup}
            </div>
          )}
          {/* Warmup label */}
          {ex?.isWarmup && (
            <div style={{ fontSize: 11, color: "var(--lime)", fontWeight: 600, marginTop: 2 }}>
              Calentamiento
            </div>
          )}
          {/* Exercise notes from coach */}
          {ex?.target?.notes && (
            <div style={{ fontSize: 12, color: "var(--lime)", marginTop: 3, lineHeight: 1.4 }}>
              {ex.target.notes}
            </div>
          )}

          {/* Action row: view media + swap */}
          {ex && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {ex.media?.length > 0 && (
                <button
                  onClick={() => setMediaOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Icon name="image" size={12} color="var(--text-mute)" />
                  Ver demo ({ex.media.length})
                </button>
              )}
              {ex.alternatives?.length > 0 && (
                <button
                  onClick={() => setSwapOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Icon name="repeat" size={12} color="var(--text-mute)" />
                  Cambiar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target line */}
      {ex && (
        <div className="ta-mono" style={{ padding: "0 20px 4px", fontSize: 11, color: "var(--text-mute)" }}>
          {[
            ex.target?.sets && ex.target?.reps ? `${ex.target.sets} × ${ex.target.reps}` : null,
            ex.target?.intensityTarget ? `@ ${ex.target.intensityType?.toUpperCase() ?? ""} ${ex.target.intensityTarget}` : null,
            ex.target?.restSeconds ? `${ex.target.restSeconds}s descanso` : null,
          ].filter(Boolean).join(" · ")}
        </div>
      )}

      {/* ── Series log ── */}
      {ex && (
        <div style={{ padding: "14px 16px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr", gap: 6, padding: "0 4px 8px", fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>
            <div>Serie</div>
            <div style={{ textAlign: "center" }}>Reps</div>
            <div style={{ textAlign: "center" }}>Kg</div>
            <div style={{ textAlign: "center" }}>{effortMode}</div>
          </div>

          {ex.sets.map((s: WorkoutSet) => {
            const isEditing = editingSet?.setNumber === s.setNumber;
            if (isEditing) {
              return (
                <div key={s.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr", gap: 6, alignItems: "center", padding: "8px 4px", background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: "10px 10px 0 0" }}>
                    <div className="ta-mono" style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)", color: "var(--text-mute)", fontSize: 11, fontWeight: 600 }}>
                      {s.setNumber}
                    </div>
                    {(["reps", "kg", "effort"] as const).map((field) => (
                      <input key={field} type="number" inputMode="decimal"
                        value={editingSet![field]}
                        onChange={(e) => setEditingSet((d) => d ? { ...d, [field]: e.target.value } : d)}
                        placeholder="—"
                        style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "8px 0", fontSize: 17, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, padding: "6px 4px", background: "var(--bg-1)", border: "1px solid var(--line-2)", borderTop: "none", borderRadius: "0 0 10px 10px" }}>
                    <button onClick={() => deleteSet(s.setNumber)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Eliminar
                    </button>
                    <button onClick={() => setEditingSet(null)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Cancelar
                    </button>
                    <button onClick={saveEditedSet}
                      style={{ flex: 1, padding: "5px 10px", borderRadius: 8, border: "none", background: "var(--lime)", color: "#0B0B0C", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Guardar
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={s.id}
                onClick={() => setEditingSet({ setNumber: s.setNumber, reps: String(s.reps ?? ""), kg: String(s.weight ?? ""), effort: String((effortMode === "RPE" ? s.rpe : s.rir) ?? "") })}
                style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr", gap: 6, alignItems: "center", padding: "8px 4px", borderRadius: 10, marginBottom: 4, cursor: "pointer" }}
                className="ta-row"
              >
                <div className="ta-mono" style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--success)", color: "#0B0B0C", fontSize: 11, fontWeight: 600 }}>
                  <Icon name="check" size={12} />
                </div>
                {[s.reps ?? "—", s.weight ?? "—", (effortMode === "RPE" ? s.rpe : s.rir) ?? "—"].map((v, i) => (
                  <div key={i} className="ta-mono" style={{ textAlign: "center", fontSize: 17, fontWeight: 600 }}>{v}</div>
                ))}
              </div>
            );
          })}

          {/* Active new serie row */}
          <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr", gap: 6, alignItems: "center", padding: "8px 4px", background: "var(--bg-1)", border: "1px solid var(--lime)", borderRadius: 10, marginBottom: 4 }}>
            <div className="ta-mono" style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)", color: "var(--text-mute)", fontSize: 11, fontWeight: 600 }}>
              {ex.sets.length + 1}
            </div>
            {(["reps", "kg", "effort"] as const).map((field) => (
              <input key={field} type="number" inputMode="decimal" value={draft[field]}
                onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                placeholder="—"
                style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "8px 0", fontSize: 17, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
              />
            ))}
          </div>

          {/* Effort toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>Esfuerzo</span>
            <Tabs variant="pills" tabs={["RPE", "RIR"]} active={effortMode} onChange={(t) => setEffortMode(t as EffortMode)} />
          </div>
        </div>
      )}

      {/* ── Exercise list ── */}
      <div style={{ margin: "8px 16px 0", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>

        {/* Warmup section */}
        {warmupExercises.length > 0 && (
          <>
            <div style={{ padding: "7px 12px", background: "rgba(132,204,22,.06)", borderBottom: "1px solid var(--line)", fontSize: 10, fontWeight: 700, color: "var(--lime)", textTransform: "uppercase", letterSpacing: ".1em" }}>
              Calentamiento
            </div>
            {warmupExercises.map((e, wIdx) => {
              const realIdx = session.exercises.findIndex((s) => s.id === e.id);
              const done = e.sets.length >= (e.target?.sets ?? 3);
              const active = realIdx === currentExIdx;
              return (
                <button key={e.id} onClick={() => goToEx(realIdx)}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", minHeight: 44, background: active ? "rgba(132,204,22,.06)" : "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", textAlign: "left" }}
                >
                  <span className="ta-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--lime)", width: 18, flexShrink: 0 }}>C{wIdx + 1}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: done ? "var(--text-mute)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.exercise.name}
                  </span>
                  <span className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: done ? "var(--success)" : active ? "var(--lime)" : "var(--text-dim)", flexShrink: 0 }}>
                    {e.sets.length}/{e.target?.sets ?? "—"}
                  </span>
                  {done && <Icon name="check" size={13} color="var(--success)" />}
                </button>
              );
            })}
          </>
        )}

        {/* Work exercises — grouped by supersetGroup */}
        {(() => {
          const groups: Array<{ group: string | null; items: Array<{ e: SessionExercise; realIdx: number }> }> = [];
          for (const e of workExercises) {
            const realIdx = session.exercises.findIndex((s) => s.id === e.id);
            const last = groups[groups.length - 1];
            if (e.supersetGroup && last?.group === e.supersetGroup) {
              last.items.push({ e, realIdx });
            } else {
              groups.push({ group: e.supersetGroup ?? null, items: [{ e, realIdx }] });
            }
          }

          return groups.map((g, gi) => {
            const gc = g.group ? (GROUP_COLORS[g.group] ?? "var(--text-mute)") : null;
            const isSuperset = g.items.length > 1 || !!g.group;
            const groupName = g.group ? `${groupLabel(g.items.length)} ${g.group}` : null;

            return (
              <div key={gi}>
                {isSuperset && groupName && (
                  <div style={{ padding: "5px 12px 5px 14px", borderBottom: "1px solid var(--line)", borderLeft: `3px solid ${gc}`, background: `${gc}0d`, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: gc ?? "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em" }}>{groupName}</span>
                  </div>
                )}
                {g.items.map(({ e, realIdx }, itemIdx) => {
                  const done = e.sets.length >= (e.target?.sets ?? 3);
                  const active = realIdx === currentExIdx;
                  const isLast = itemIdx === g.items.length - 1 && gi === groups.length - 1;
                  return (
                    <button key={e.id} onClick={() => goToEx(realIdx)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%",
                        padding: "10px 12px", minHeight: 44,
                        paddingLeft: isSuperset ? 14 : 12,
                        background: active ? "rgba(255,255,255,.03)" : "transparent",
                        border: "none",
                        borderLeft: isSuperset ? `3px solid ${gc}40` : "3px solid transparent",
                        borderBottom: isLast ? "none" : "1px solid var(--line)",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: done ? "var(--success)" : active ? "var(--lime)" : "var(--bg-3)" }} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: done ? "var(--text-mute)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.exercise.name}
                      </span>
                      <span className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: done ? "var(--success)" : active ? "var(--lime)" : "var(--text-dim)", flexShrink: 0 }}>
                        {e.sets.length}/{e.target?.sets ?? "—"}
                      </span>
                      {done && <Icon name="check" size={13} color="var(--success)" />}
                    </button>
                  );
                })}
              </div>
            );
          });
        })()}

        {/* Add exercise */}
        <button onClick={() => setShowPicker(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderTop: "1px solid var(--line)", cursor: "pointer", color: "var(--text-dim)", fontSize: 13 }}
        >
          <Icon name="plus" size={14} color="var(--text-dim)" />
          Agregar ejercicio
        </button>
      </div>

      {/* ── Session notes toggle ── */}
      <div style={{ padding: "4px 16px 8px" }}>
        <button
          onClick={() => setNotesOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: "var(--text-mute)", fontSize: 13, fontWeight: 600 }}
        >
          <Icon name="edit" size={13} color="var(--text-mute)" />
          {notesOpen ? "Cerrar notas" : sessionNotes ? "Notas de sesión" : "Agregar nota de sesión"}
        </button>
        {notesOpen && (
          <div
            style={{
              marginTop: 6, padding: 12, background: "var(--bg-1)",
              border: "1px solid var(--line-2)", borderRadius: 10,
            }}
          >
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              onBlur={() => saveNotes(sessionNotes)}
              placeholder="¿Cómo te sentiste? ¿Algo que destacar de la sesión?"
              rows={3}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)",
                lineHeight: 1.5, resize: "none",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom CTAs ── */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: keyboardOffset, padding: "14px 16px 28px", background: "linear-gradient(to top, var(--bg) 70%, transparent)", display: "flex", gap: 8 }}>
        {/* Back arrow — go to previous exercise */}
        {currentExIdx > 0 && (
          <Button size="xl" variant="secondary" style={{ width: 56 }}
            onClick={() => goToEx(currentExIdx - 1)}
            icon="chevL"
          />
        )}

        {completedExs === session.exercises.length ? (
          <Button size="xl" block icon="check" style={{ fontSize: 16 }} disabled={completing} onClick={completeSession}>
            {completing ? "Completando…" : "Finalizar sesión"}
          </Button>
        ) : (
          <>
            {currentExIdx < session.exercises.length - 1 && (
              <Button size="xl" variant="secondary" style={{ width: 56 }}
                onClick={() => goToEx(currentExIdx + 1)}
                icon="chevR"
              />
            )}
            <Button size="xl" icon="check" style={{ flex: 1, fontSize: 16 }}
              disabled={saving || !draft.reps}
              onClick={logSet}
            >
              {saving ? "Guardando…" : "Guardar serie"}
            </Button>
          </>
        )}
      </div>

      {/* Rest timer overlay */}
      {restSeconds != null && restSeconds > 0 && (
        <RestTimerOverlay seconds={restSeconds} onSkip={() => setRestSeconds(null)} />
      )}

      {/* Exercise picker */}
      {showPicker && (
        <ExercisePicker sessionId={sessionId}
          onAdd={(wse) => {
            setSession((prev) => prev ? { ...prev, exercises: [...prev.exercises, wse] } : prev);
            setCurrentExIdx(session.exercises.length);
            setDraft({ reps: "", kg: "", effort: "" });
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Media lightbox */}
      {mediaOpen && ex?.media?.length > 0 && (
        <MediaLightbox media={ex.media} onClose={() => setMediaOpen(false)} />
      )}

      {/* Swap exercise sheet */}
      {swapOpen && ex && (
        <SwapSheet
          ex={ex}
          sessionId={sessionId}
          onSwapped={() => load()}
          onClose={() => setSwapOpen(false)}
        />
      )}
    </div>
  );
}
