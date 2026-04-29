"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Button, Icon, StateBlock, Tabs } from "@/components/ui";
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

function fmtDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Session header ───────────────────────────────────────────────────────────

function SessionHeader({
  exNum, exTotal, title, subtitle, time, onExit,
}: {
  exNum: number; exTotal: number; title: string; subtitle?: string; time?: string; onExit: () => void;
}) {
  return (
    <div style={{ position: "relative", padding: "50px 14px 12px", borderBottom: "1px solid var(--line)", background: "var(--bg)" }}>
      <button
        onClick={onExit}
        style={{
          width: 30, height: 30, borderRadius: 7,
          background: "var(--bg-2)", border: "1px solid var(--line-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text)", cursor: "pointer",
          position: "absolute", top: 48, left: 12,
        }}
      >
        <Icon name="x" size={14} />
      </button>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, textAlign: "center", marginTop: 6 }}>
        EJERCICIO {exNum} / {exTotal}
      </div>
      {time && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              color: "var(--text)",
            }}
          >
            <Icon name="timer" size={12} color="var(--text-mute)" />
            <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700 }}>{time}</span>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 6 }}>
        {Array.from({ length: exTotal }).map((_, i) => (
          <div key={i} style={{
            width: Math.min(18, Math.floor(260 / exTotal) - 2),
            height: 3, borderRadius: 2,
            background: i < exNum ? "var(--lime)" : "var(--bg-3)",
          }} />
        ))}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em", textAlign: "center", marginTop: 8 }}>
        {title}
      </div>
      {subtitle && (
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", textAlign: "center", marginTop: 2 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Set row ──────────────────────────────────────────────────────────────────

function SetRowDisplay({
  s, effortMode, onClick,
}: {
  s: WorkoutSet; effortMode: EffortMode; onClick: () => void;
}) {
  const effort = effortMode === "RPE" ? s.rpe : s.rir;
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: "32px 1fr 1fr 56px 22px",
        gap: 6, alignItems: "center", padding: "8px 8px",
        background: "var(--bg-1)", border: "1px solid var(--line)",
        borderRadius: 9, cursor: "pointer", marginBottom: 4,
      }}
    >
      <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700 }}>
        SERIE {s.setNumber}
      </div>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="ta-mono" style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{s.weight ?? "—"}</span>
        <span style={{ fontSize: 9, color: "var(--text-dim)" }}>kg</span>
      </div>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="ta-mono" style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{s.reps ?? "—"}</span>
        <span style={{ fontSize: 9, color: "var(--text-dim)" }}>rep</span>
      </div>
      <div style={{ textAlign: "center", padding: "3px 0", background: effort == null ? "transparent" : "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6 }}>
        <span className="ta-mono" style={{ fontSize: 11, color: effort == null ? "var(--text-dim)" : "var(--lime)", fontWeight: 700 }}>
          {effort != null ? `${effortMode} ${effort}` : "—"}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Icon name="check" size={14} color="var(--success)" />
      </div>
    </div>
  );
}

function ActiveSetRow({
  setNum, draft, effortMode, onChange,
}: {
  setNum: number; draft: SetDraft; effortMode: EffortMode; onChange: (d: Partial<SetDraft>) => void;
}) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 1fr 1fr 56px 22px",
      gap: 6, alignItems: "center", padding: "8px 8px",
      background: "rgba(215,255,58,.06)", border: "1px solid var(--lime)",
      borderRadius: 9, marginBottom: 4,
    }}>
      <div className="ta-mono" style={{ fontSize: 11, color: "var(--lime)", fontWeight: 700 }}>
        SERIE {setNum}
      </div>
      <input
        type="number" inputMode="decimal" value={draft.kg}
        onChange={(e) => onChange({ kg: e.target.value })}
        placeholder="0"
        style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "6px 8px", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none", textAlign: "center" }}
      />
      <input
        type="number" inputMode="decimal" value={draft.reps}
        onChange={(e) => onChange({ reps: e.target.value })}
        placeholder="0"
        style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "6px 8px", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none", textAlign: "center" }}
      />
      <input
        type="number" inputMode="decimal" value={draft.effort}
        onChange={(e) => onChange({ effort: e.target.value })}
        placeholder={effortMode}
        style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "6px 4px", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none", textAlign: "center" }}
      />
      <div />
    </div>
  );
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
  const [options, setOptions] = useState<ExerciseOption[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const q = search.trim();
    api.get<ExerciseOption[]>(`/coach/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setOptions)
      .catch((e) => {
        console.error(e);
        setOptions([]);
      });
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
            <input
              autoFocus
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOptions(null); }}
              placeholder="Buscar…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }}
            />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {options === null ? (
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

      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, padding: "0 16px" }}>
        {m.mediaType === "video" ? (
          <video key={m.url} src={m.url} controls autoPlay style={{ width: "100%", borderRadius: 12, maxHeight: "70dvh" }} />
        ) : (
          <div style={{ position: "relative", width: "100%", height: "70dvh" }}>
            <Image unoptimized src={m.url} alt="" fill sizes="(max-width: 540px) 100vw, 540px" style={{ borderRadius: 12, objectFit: "contain" }} />
          </div>
        )}

        {media.length > 1 && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
            {media.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,.3)", border: "none", cursor: "pointer", padding: 0 }} />
            ))}
          </div>
        )}

        {media.length > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "0 8px" }}>
            <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 14, cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}>
              ← Ant.
            </button>
            <button onClick={() => setIdx((i) => Math.min(media.length - 1, i + 1))} disabled={idx === media.length - 1}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 14, cursor: "pointer", opacity: idx === media.length - 1 ? 0.3 : 1 }}>
              Sig. →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Swap exercise sheet ──────────────────────────────────────────────────────

function SwapSheet({
  ex, sessionId, onSwapped, onClose,
}: {
  ex: SessionExercise; sessionId: string; onSwapped: () => void; onClose: () => void;
}) {
  const { api } = useAuth();
  const [swapping, setSwapping] = useState<string | null>(null);

  async function doSwap(altExerciseId: string) {
    setSwapping(altExerciseId);
    try {
      await api.patch(`/client/sessions/${sessionId}/exercises/${ex.id}`, { swapExerciseId: altExerciseId });
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
                background: "none", cursor: swapping === alt.exerciseId ? "wait" : "pointer",
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
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>{MUSCLE_LABEL[alt.primaryMuscle] ?? alt.primaryMuscle}</div>
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

function RestTimerOverlay({
  seconds, total, nextEx, onSkip, onAdjust,
}: {
  seconds: number;
  total: number;
  nextEx: SessionExercise | null;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;
  const circumference = 2 * Math.PI * 92;
  const progress = total > 0 ? Math.max(0, seconds / total) : 0;
  const dashoffset = circumference * (1 - progress);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      background: "radial-gradient(circle at 50% 40%, rgba(215,255,58,.08), transparent 60%), var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header space */}
      <div style={{ height: 60 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", letterSpacing: ".15em", fontWeight: 700 }}>DESCANSO</div>

        {/* SVG ring */}
        <div style={{ position: "relative", width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--bg-2)" strokeWidth="6" />
            <circle
              cx="100" cy="100" r="92" fill="none"
              stroke={seconds <= 10 ? "var(--warn)" : "var(--lime)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <div className="ta-mono" style={{ fontSize: 52, fontWeight: 700, color: seconds <= 10 ? "var(--warn)" : "var(--text)", letterSpacing: "-.02em", lineHeight: 1 }}>
              {display}
            </div>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".1em" }}>
              DE {Math.floor(total / 60)}:{String(total % 60).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button size="md" variant="secondary" onClick={() => onAdjust(-15)}>−15s</Button>
          <Button size="md" variant="secondary" onClick={onSkip}>Saltar</Button>
          <Button size="md" variant="secondary" onClick={() => onAdjust(15)}>+15s</Button>
        </div>

        {nextEx && (
          <div style={{
            padding: "10px 14px", background: "var(--bg-1)", border: "1px solid var(--line)",
            borderRadius: 10, textAlign: "center", maxWidth: 260,
          }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>
              SIGUIENTE{nextEx.supersetGroup ? ` · ${nextEx.supersetGroup}` : ""}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{nextEx.exercise.name}</div>
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
              {[
                nextEx.target?.sets && nextEx.target?.reps ? `${nextEx.target.sets} × ${nextEx.target.reps}` : null,
                nextEx.target?.intensityType && nextEx.target?.intensityTarget
                  ? `${nextEx.target.intensityType.toUpperCase()} ${nextEx.target.intensityTarget}`
                  : null,
              ].filter(Boolean).join(" · ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WarmupOverlay({
  elapsedMs,
  targetMs,
  notes,
  exercises,
  running,
  onToggle,
  onReset,
  onDone,
}: {
  elapsedMs: number;
  targetMs: number | null;
  notes: string | null | undefined;
  exercises: SessionExercise[];
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const display = fmtDuration(elapsedMs);
  const circumference = 2 * Math.PI * 92;
  const progress = targetMs && targetMs > 0 ? Math.min(1, elapsedMs / targetMs) : 0;
  const dashoffset = circumference * (1 - progress);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 950,
      background: "radial-gradient(circle at 50% 40%, rgba(215,255,58,.08), transparent 60%), var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ height: 60 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
        <div className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", letterSpacing: ".15em", fontWeight: 700 }}>CALENTAMIENTO</div>

        <div style={{ position: "relative", width: 200, height: 200 }}>
          <svg width="200" height="200" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--bg-2)" strokeWidth="6" />
            {targetMs && targetMs > 0 && (
              <circle
                cx="100" cy="100" r="92" fill="none"
                stroke="var(--lime)"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            )}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div className="ta-mono" style={{ fontSize: 52, fontWeight: 700, color: "var(--text)", letterSpacing: "-.02em", lineHeight: 1 }}>
              {display}
            </div>
            {targetMs && targetMs > 0 && (
              <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".1em" }}>
                OBJ {fmtDuration(targetMs)}
              </div>
            )}
          </div>
        </div>

        {notes && (
          <div style={{
            padding: "10px 14px",
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            maxWidth: 340,
            width: "100%",
          }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
              INDICACIONES
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap" }}>{notes}</div>
          </div>
        )}

        {exercises.length > 0 && (
          <div style={{ width: "100%", maxWidth: 340 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
              EJERCICIOS
            </div>
            {exercises.map((e) => (
              <div key={e.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", background: "var(--bg-1)", border: "1px solid var(--line)",
                borderRadius: 10, marginBottom: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{e.exercise.name}</div>
                  {(e.target?.sets || e.target?.reps) && (
                    <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 1 }}>
                      {[e.target?.sets ? `${e.target.sets} series` : null, e.target?.reps ? e.target.reps : null].filter(Boolean).join(" × ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <Button size="md" variant="secondary" icon={running ? "pause" : "play"} onClick={onToggle}>
            {running ? "Pausa" : "Play"}
          </Button>
          <Button size="md" variant="secondary" onClick={onReset}>Reiniciar</Button>
        </div>

        <div style={{ width: "100%", maxWidth: 340 }}>
          <Button size="xl" icon="check" onClick={onDone} style={{ width: "100%" }}>
            Terminé el calentamiento
          </Button>
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
  const [showPicker, setShowPicker] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [preSelectExIdx, setPreSelectExIdx] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(90);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [editingSet, setEditingSet] = useState<{ setNumber: number; reps: string; kg: string; effort: string } | null>(null);
  const queueKey = `regen_offline_${sessionId}`;
  const [offlineCount, setOfflineCount] = useState(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const warmupDoneKey = `regen_warmup_done_${sessionId}`;
  const warmupTimerKey = `regen_warmup_timer_${sessionId}`;
  const [workoutStartedAtMs, setWorkoutStartedAtMs] = useState<number | null>(null);
  const [warmupDone, setWarmupDone] = useState(true);
  const [warmupTimer, setWarmupTimer] = useState<{ accMs: number; runningSince: number | null }>({ accMs: 0, runningSince: null });
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [sheetRows, setSheetRows] = useState<Array<{ setNumber: number; reps: string; kg: string; effort: string; existingId?: string }>>([]);
  const [prefillExId, setPrefillExId] = useState<string | null>(null);
  const [didInitIdx, setDidInitIdx] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    const id0 = setTimeout(() => setNowMs(Date.now()), 0);
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => { clearTimeout(id0); clearInterval(id); };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(queueKey);
        if (!stored) { setOfflineCount(0); return; }
        const parsed = JSON.parse(stored);
        setOfflineCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setOfflineCount(0);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [queueKey]);

  const load = useCallback(() => {
    api
      .get<SessionDetail>(`/client/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        setSessionNotes(s.sessionNotes ?? "");
        setWorkoutStartedAtMs(new Date(s.performedAt).getTime());
        if (!didInitIdx) {
          setDidInitIdx(true);
          const firstWorkIdx = s.exercises.findIndex((e) => !e.isWarmup);
          if (firstWorkIdx >= 0) setCurrentExIdx(firstWorkIdx);
        }
        if (s.status === "completed") router.replace(`/sesion/${sessionId}/completada`);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, didInitIdx, sessionId, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!session) return;
    const hasWarmup =
      !!session.workoutTemplate?.warmupMinutes ||
      !!session.workoutTemplate?.warmupNotes ||
      session.exercises.some((e) => e.isWarmup);

    const id = setTimeout(() => {
      if (!hasWarmup) {
        setWarmupDone(true);
        return;
      }

      let done = false;
      try { done = window.localStorage.getItem(warmupDoneKey) === "1"; } catch {}
      setWarmupDone(done);

      try {
        const raw = window.localStorage.getItem(warmupTimerKey);
        if (!raw) { setWarmupTimer({ accMs: 0, runningSince: null }); return; }
        const parsed = JSON.parse(raw) as { accMs?: unknown; runningSince?: unknown };
        const accMs = typeof parsed.accMs === "number" ? parsed.accMs : 0;
        setWarmupTimer({ accMs, runningSince: null });
      } catch {
        setWarmupTimer({ accMs: 0, runningSince: null });
      }
    }, 0);

    return () => clearTimeout(id);
  }, [session, warmupDoneKey, warmupTimerKey]);

  useEffect(() => {
    if (warmupTimer.runningSince == null) return;
    const persist = () => {
      setWarmupTimer((prev) => {
        if (prev.runningSince == null) return prev;
        const now = Date.now();
        const next = { accMs: prev.accMs + (now - prev.runningSince), runningSince: now };
        try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
        return next;
      });
    };
    return () => {
      persist();
    };
  }, [warmupTimer.runningSince, warmupTimerKey]);

  const toggleWarmup = useCallback(() => {
    setWarmupTimer((prev) => {
      const now = Date.now();
      const next =
        prev.runningSince == null
          ? { ...prev, runningSince: now }
          : { accMs: prev.accMs + (now - prev.runningSince), runningSince: null as number | null };
      try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [warmupTimerKey]);

  const resetWarmup = useCallback(() => {
    const next = { accMs: 0, runningSince: null as number | null };
    try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
    setWarmupTimer(next);
  }, [warmupTimerKey]);

  const finishWarmup = useCallback(() => {
    try { window.localStorage.setItem(warmupDoneKey, "1"); } catch {}
    setWarmupDone(true);
    setWarmupTimer((prev) => {
      const now = Date.now();
      const next = { accMs: prev.accMs + (prev.runningSince ? now - prev.runningSince : 0), runningSince: null as number | null };
      try { window.localStorage.setItem(warmupTimerKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [warmupDoneKey, warmupTimerKey]);

  // Rest timer countdown
  useEffect(() => {
    if (restSeconds == null || restSeconds <= 0) return;
    const id = setTimeout(() => {
      setRestSeconds((s) => {
        if (s == null) return null;
        if (s <= 1) return null;
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [restSeconds]);

  const flushQueue = useCallback(async () => {
    try {
      const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
      if (!queue.length) return;
      const remaining: OfflineItem[] = [];
      for (const item of queue) {
        try {
          await api.put(
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
    const id = setTimeout(() => flushQueue(), 0);
    window.addEventListener("online", flushQueue);
    return () => {
      clearTimeout(id);
      window.removeEventListener("online", flushQueue);
    };
  }, [flushQueue]);

  // Keyboard awareness
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

  useEffect(() => {
    if (!session) return;
    const ex = session.exercises[currentExIdx];
    if (!ex) return;
    if (prefillExId === ex.id) return;
    const intensityType = ex.target?.intensityType?.toUpperCase();
    const nextMode: EffortMode = intensityType === "RIR" ? "RIR" : "RPE";

    const isNumeric = (v: string | null | undefined) => {
      if (!v) return false;
      return /^[0-9]+([.,][0-9]+)?$/.test(v.trim());
    };

    const targetReps = isNumeric(ex.target?.reps) ? ex.target!.reps!.trim().replace(",", ".") : "";
    const targetEffort = isNumeric(ex.target?.intensityTarget) ? ex.target!.intensityTarget!.trim().replace(",", ".") : "";

    const id = setTimeout(() => {
      setPrefillExId(ex.id);
      setEffortMode(nextMode);
      setDraft({ reps: targetReps, kg: "", effort: targetEffort });
      setEditingSet(null);
    }, 0);
    return () => clearTimeout(id);
  }, [session, currentExIdx, prefillExId]);

  useEffect(() => {
    if (!loggerOpen || !session) return;
    const target = session.exercises[currentExIdx];
    if (!target || target.isWarmup) return;
    const id = setTimeout(() => {
      const existing = target.sets ?? [];
      const baseCount = Math.max(existing.length, target.target?.sets ?? 0, 1);
      setSheetRows(
        Array.from({ length: baseCount }).map((_, idx) => {
          const setNumber = idx + 1;
          const s = existing.find((x) => x.setNumber === setNumber);
          const effort = effortMode === "RPE" ? s?.rpe : s?.rir;
          return {
            setNumber,
            reps: s?.reps != null ? String(s.reps) : "",
            kg: s?.weight != null ? String(s.weight) : "",
            effort: effort != null ? String(effort) : "",
            existingId: s?.id,
          };
        }),
      );
    }, 0);
    return () => clearTimeout(id);
  }, [loggerOpen, session, currentExIdx, effortMode]);

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
      load();

      // Rest logic: supersets rest only after the last exercise in the block
      const g = ex.supersetGroup;
      if (g) {
        const groupExs = session.exercises.filter((e) => e.supersetGroup === g);
        const posInGroup = groupExs.findIndex((e) => e.id === ex.id);
        const nextInGroup = groupExs[posInGroup + 1];
        if (nextInGroup) {
          // Not last in block — move to next exercise, no rest
          goToEx(session.exercises.findIndex((e) => e.id === nextInGroup.id));
        } else {
          // Last in block — rest, then return to first of group
          const firstIdx = session.exercises.findIndex((e) => e.id === groupExs[0]!.id);
          const rest = ex.target?.restSeconds ?? 90;
          setRestTotal(rest);
          setRestSeconds(rest);
          goToEx(firstIdx);
        }
      } else {
        const rest = ex.target?.restSeconds ?? 90;
        setRestTotal(rest);
        setRestSeconds(rest);
      }
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

  function buildSheetRowsFor(target: SessionExercise) {
    const existing = target.sets ?? [];
    const baseCount = Math.max(existing.length, target.target?.sets ?? 0, 1);
    return Array.from({ length: baseCount }).map((_, idx) => {
      const setNumber = idx + 1;
      const s = existing.find((x) => x.setNumber === setNumber);
      const effort = effortMode === "RPE" ? s?.rpe : s?.rir;
      return {
        setNumber,
        reps: s?.reps != null ? String(s.reps) : "",
        kg: s?.weight != null ? String(s.weight) : "",
        effort: effort != null ? String(effort) : "",
        existingId: s?.id,
      };
    });
  }

  function openLogger(target: SessionExercise) {
    setSheetRows(buildSheetRowsFor(target));
    setLoggerOpen(true);
  }

  function goToEx(i: number) {
    const target = session?.exercises[i];
    const hasAlternatives = (target?.alternatives?.length ?? 0) > 0;
    const hasNoSets = (target?.sets?.length ?? 0) === 0;
    if (target && hasAlternatives && hasNoSets) {
      setPreSelectExIdx(i);
      return;
    }
    setCurrentExIdx(i);
    setDraft({ reps: "", kg: "", effort: "" });
    setEditingSet(null);
    setMediaOpen(false);
    setSwapOpen(false);
    if (target && !target.isWarmup) openLogger(target);
    else setLoggerOpen(false);
  }

  function confirmGoToEx(i: number) {
    setPreSelectExIdx(null);
    setCurrentExIdx(i);
    setDraft({ reps: "", kg: "", effort: "" });
    setEditingSet(null);
    setMediaOpen(false);
    setSwapOpen(false);
    const target = session?.exercises[i];
    if (target && !target.isWarmup) openLogger(target);
    else setLoggerOpen(false);
  }

  async function resetSession() {
    if (!session?.workoutTemplate) return;
    setResetting(true);
    try {
      await api.patch(`/client/sessions/${sessionId}`, { status: "discarded" });
      const res = await api.post<{ id: string }>("/client/sessions", { workoutTemplateId: session.workoutTemplate.id });
      try { localStorage.removeItem(warmupDoneKey); } catch {}
      try { localStorage.removeItem(warmupTimerKey); } catch {}
      try { localStorage.removeItem(queueKey); } catch {}
      router.replace(`/sesion/${res.id}`);
    } catch (e) {
      console.error(e);
      setResetting(false);
    }
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
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="loading" title="Cargando sesión…" /></div>;
  }

  const ex: SessionExercise | undefined = session.exercises[currentExIdx];

  const warmupExercises = session.exercises.filter((e) => e.isWarmup);
  const workExercises = session.exercises.filter((e) => !e.isWarmup);
  const completedExs = workExercises.filter((e) => e.sets.length >= (e.target?.sets ?? 3)).length;
  const warmupExists =
    warmupExercises.length > 0 ||
    !!session.workoutTemplate?.warmupMinutes ||
    !!session.workoutTemplate?.warmupNotes;
  const warmupTargetMs =
    session.workoutTemplate?.warmupMinutes != null ? session.workoutTemplate.warmupMinutes * 60_000 : null;
  const workoutElapsedMs = workoutStartedAtMs != null ? Math.max(0, nowMs - workoutStartedAtMs) : 0;
  const warmupElapsedMs = warmupTimer.accMs + (warmupTimer.runningSince ? nowMs - warmupTimer.runningSince : 0);
  const headerExIdx = ex ? workExercises.findIndex((e) => e.id === ex.id) : -1;
  const headerExTotal = workExercises.length || session.exercises.length;
  const headerExNum = headerExIdx >= 0 ? headerExIdx + 1 : currentExIdx + 1;

  const groupSizes: Record<string, number> = {};
  workExercises.forEach((e) => {
    if (e.supersetGroup) groupSizes[e.supersetGroup] = (groupSizes[e.supersetGroup] ?? 0) + 1;
  });

  async function saveSheet() {
    if (!ex) return;
    setSheetSaving(true);
    try {
      for (const row of sheetRows) {
        const body: Record<string, string> = { reps: row.reps, weight: row.kg };
        if (effortMode === "RPE") body.rpe = row.effort;
        else body.rir = row.effort;
        const hasAny = !!(row.reps || row.kg || row.effort);
        if (!hasAny) continue;
        try {
          await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${row.setNumber}`, body);
        } catch {
          try {
            const queue: OfflineItem[] = JSON.parse(localStorage.getItem(queueKey) ?? "[]");
            queue.push({ wseId: ex.id, setNumber: row.setNumber, body });
            localStorage.setItem(queueKey, JSON.stringify(queue));
            setOfflineCount(queue.length);
            setLastSaved("guardado offline");
          } catch {}
        }
      }
      setLastSaved(new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }));
      load();
    } finally {
      setSheetSaving(false);
    }
  }

  // Build subtitle for session header
  let exSubtitle: string | undefined;
  if (ex) {
    const parts: string[] = [];
    if (ex.supersetGroup) {
      const gc = GROUP_COLORS[ex.supersetGroup];
      parts.push(`${ex.supersetGroup} · ${groupLabel(groupSizes[ex.supersetGroup] ?? 1).toUpperCase()}`);
      void gc;
    }
    if (ex.target?.sets) parts.push(`${ex.target.sets} series`);
    if (ex.target?.intensityType && ex.target?.intensityTarget) {
      parts.push(`${ex.target.intensityType.toUpperCase()} ${ex.target.intensityTarget}`);
    }
    if (parts.length) exSubtitle = parts.join(" · ");
  }

  const hasMedia = (ex?.media?.length ?? 0) > 0;
  const nextEx = session.exercises[currentExIdx + 1] ?? null;
  const currentWorkPos = ex ? workExercises.findIndex((e) => e.id === ex.id) : -1;
  const prevRealIdx =
    currentWorkPos > 0 ? session.exercises.findIndex((s) => s.id === workExercises[currentWorkPos - 1]!.id) : null;
  const nextRealIdx =
    currentWorkPos >= 0 && currentWorkPos < workExercises.length - 1
      ? session.exercises.findIndex((s) => s.id === workExercises[currentWorkPos + 1]!.id)
      : null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>

      {/* Session header */}
      <SessionHeader
        exNum={headerExNum}
        exTotal={headerExTotal}
        title={ex?.exercise.name ?? "—"}
        subtitle={exSubtitle}
        time={fmtDuration(workoutElapsedMs)}
        onExit={() => router.push("/semana")}
      />

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

      {/* ── Embedded media panel (only when exercise has media) ── */}
      {hasMedia && (
        <div
          onClick={() => setMediaOpen(true)}
          style={{
            position: "relative", height: 140,
            background: "linear-gradient(135deg, #1f1f23, #0f0f12)",
            borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {ex!.exercise.thumbnailUrl ? (
            <Image unoptimized src={ex!.exercise.thumbnailUrl} alt="" fill sizes="100vw" style={{ objectFit: "cover", opacity: 0.5 }} />
          ) : null}
          <div style={{ position: "relative", zIndex: 1, width: 52, height: 52, borderRadius: 26, background: "rgba(215,255,58,.95)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="play" size={20} color="#0B0B0C" />
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4, zIndex: 1 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMediaOpen(true); }}
              style={{ padding: "4px 8px", background: "rgba(11,11,12,.7)", backdropFilter: "blur(8px)", border: "1px solid var(--line-2)", borderRadius: 5, color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
            >
              Técnica
            </button>
            {ex?.exercise.youtubeUrl && (
              <a
                href={ex.exercise.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "rgba(255,0,0,.8)", border: "none", borderRadius: 5, color: "#fff", fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
              >
                ▶ YouTube
              </a>
            )}
            {(ex?.alternatives?.length ?? 0) > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setSwapOpen(true); }}
                style={{ padding: "4px 8px", background: "rgba(11,11,12,.4)", border: "1px solid var(--line-2)", borderRadius: 5, color: "var(--text-mute)", fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
              >
                Alternativas
              </button>
            )}
          </div>
          {lastSaved && (
            <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
              <span style={{ fontSize: 10, color: "var(--success)" }}>✓ {lastSaved}</span>
            </div>
          )}
        </div>
      )}

      {/* ── No-media action row ── */}
      {!hasMedia && ex && (
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(ex.alternatives?.length ?? 0) > 0 && (
              <button
                onClick={() => setSwapOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                <Icon name="repeat" size={12} color="var(--text-mute)" />
                Cambiar
              </button>
            )}
            {ex.exercise.youtubeUrl && (
              <a
                href={ex.exercise.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,0,0,.4)", background: "transparent", color: "#ff4444", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
              >
                ▶ YouTube
              </a>
            )}
          </div>
          {lastSaved && <span style={{ fontSize: 11, color: "var(--success)" }}>✓ {lastSaved}</span>}
        </div>
      )}

      {/* ── Coach notes ── */}
      {ex?.target?.notes && (
        <div style={{ margin: "10px 16px 0", padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>NOTA DEL COACH</div>
          <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.45 }}>{ex.target.notes}</div>
        </div>
      )}

      {ex && !loggerOpen && (
        <div style={{ padding: "10px 16px 0" }}>
          <button
            onClick={() => openLogger(ex)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "var(--bg-1)",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="book" size={14} color="var(--text-mute)" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Series de este ejercicio</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Abrir</span>
          </button>
        </div>
      )}

      {/* ── Exercise list ── */}
      <div style={{ margin: "8px 16px 0", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>

        {warmupExists && (
          <>
            <div style={{ padding: "7px 12px", background: "rgba(234,179,8,.06)", borderBottom: "1px solid var(--line)", fontSize: 10, fontWeight: 700, color: "var(--warn)", textTransform: "uppercase", letterSpacing: ".1em" }}>
              Calentamiento
            </div>
            <button
              disabled={warmupDone}
              onClick={() => setWarmupDone(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                minHeight: 44,
                background: warmupDone ? "transparent" : "rgba(234,179,8,.06)",
                border: "none",
                borderBottom: "1px solid var(--line)",
                cursor: warmupDone ? "default" : "pointer",
                textAlign: "left",
                opacity: warmupDone ? 0.9 : 1,
              }}
            >
              <span className="ta-mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)", width: 44, flexShrink: 0 }}>
                BLOQUE
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Calentamiento
              </span>
              <span className="ta-mono" style={{ fontSize: 11, fontWeight: 700, color: warmupDone ? "var(--success)" : "var(--text-dim)", flexShrink: 0 }}>
                {warmupDone ? "LISTO" : warmupTargetMs ? fmtDuration(warmupTargetMs) : "—"}
              </span>
              {warmupDone && <Icon name="check" size={13} color="var(--success)" />}
            </button>
          </>
        )}

        {/* Work exercises grouped by superset */}
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
                    {g.items[0]?.e.target?.groupNote && (
                      <span style={{ fontSize: 10, color: gc ?? "var(--text-mute)", opacity: 0.8 }}>· {g.items[0].e.target.groupNote}</span>
                    )}
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

        <button onClick={() => setShowPicker(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", background: "transparent", border: "none", borderTop: "1px solid var(--line)", cursor: "pointer", color: "var(--text-dim)", fontSize: 13 }}
        >
          <Icon name="plus" size={14} color="var(--text-dim)" />
          Agregar ejercicio
        </button>
      </div>

      {/* ── Session notes ── */}
      <div style={{ padding: "4px 16px 8px" }}>
        <button
          onClick={() => setNotesOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "6px 0", color: "var(--text-mute)", fontSize: 13, fontWeight: 600 }}
        >
          <Icon name="edit" size={13} color="var(--text-mute)" />
          {notesOpen ? "Cerrar notas" : sessionNotes ? "Notas de sesión" : "Agregar nota de sesión"}
        </button>
        {notesOpen && (
          <div style={{ marginTop: 6, padding: 12, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 10 }}>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              onBlur={() => saveNotes(sessionNotes)}
              placeholder="¿Cómo te sentiste? ¿Algo que destacar de la sesión?"
              rows={3}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.5, resize: "none" }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom CTAs ── */}
      {!(warmupExists && !warmupDone) && !loggerOpen && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: keyboardOffset,
          padding: "4px 16px 28px",
          background: "linear-gradient(to top, var(--bg) 70%, transparent)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {completedExs < workExercises.length && (
              <button
                onClick={completeSession}
                disabled={completing}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: "var(--text-dim)", fontSize: 12, fontWeight: 600 }}
              >
                Terminar entrenamiento
              </button>
            )}
            <button
              onClick={() => setShowReset(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", color: "var(--danger)", fontSize: 12, fontWeight: 600 }}
            >
              Reiniciar
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {prevRealIdx != null && prevRealIdx >= 0 && (
              <Button size="xl" variant="secondary" style={{ width: 56 }} onClick={() => goToEx(prevRealIdx)} icon="chevL" />
            )}

            {completedExs === workExercises.length ? (
              <Button size="xl" block icon="check" style={{ fontSize: 16 }} disabled={completing} onClick={completeSession}>
                {completing ? "Completando…" : "Finalizar sesión"}
              </Button>
            ) : (
              <>
                {nextRealIdx != null && nextRealIdx >= 0 && (
                  <Button size="xl" variant="secondary" style={{ width: 56 }} onClick={() => goToEx(nextRealIdx)} icon="chevR" />
                )}
                <Button size="xl" icon="book" style={{ flex: 1, fontSize: 16 }} disabled={!ex} onClick={() => ex && openLogger(ex)}>
                  Registrar series
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {loggerOpen && ex && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1300 }}
          onClick={() => setLoggerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 540,
              background: "var(--bg-1)",
              borderRadius: "16px 16px 0 0",
              padding: "14px 14px 18px",
              paddingBottom: "calc(18px + env(safe-area-inset-bottom))",
              maxHeight: "calc(100dvh - 40px)",
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                onClick={() => setLoggerOpen(false)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text)", cursor: "pointer" }}
              >
                <Icon name="x" size={14} color="var(--text)" />
              </button>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ex.exercise.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                  {ex.sets.length}/{ex.target?.sets ?? "—"} series
                </div>
              </div>
              <button
                onClick={() => setSheetRows((prev) => prev.length < 1 ? [{ setNumber: 1, reps: "", kg: "", effort: "" }] : prev)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text)", cursor: "pointer" }}
                aria-label="Reset"
              >
                <Icon name="repeat" size={14} color="var(--text-mute)" />
              </button>
              <button
                onClick={() => setSheetRows((prev) => [...prev, { setNumber: prev.length + 1, reps: "", kg: "", effort: "" }])}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text)", cursor: "pointer" }}
                aria-label="Agregar serie"
              >
                <Icon name="plus" size={14} color="var(--text)" />
              </button>
              <button
                onClick={() => setSheetRows((prev) => {
                  if (prev.length <= 1) return prev;
                  const last = prev[prev.length - 1]!;
                  if (last.existingId) return prev;
                  if (last.reps || last.kg || last.effort) return prev;
                  return prev.slice(0, -1);
                })}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--text)", cursor: "pointer" }}
                aria-label="Quitar serie"
              >
                <Icon name="x" size={14} color="var(--text)" />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Esfuerzo</span>
              <Tabs variant="pills" tabs={["RPE", "RIR"]} active={effortMode} onChange={(t) => setEffortMode(t as EffortMode)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, padding: "0 2px 8px", fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 800 }}>
              <div>Serie</div>
              <div style={{ textAlign: "center" }}>kg</div>
              <div style={{ textAlign: "center" }}>reps</div>
              <div style={{ textAlign: "center" }}>{effortMode}</div>
              <div />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sheetRows.map((row) => (
                <div key={row.setNumber} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 70px 68px", gap: 6, alignItems: "center" }}>
                  <div className="ta-mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--text-mute)" }}>{row.setNumber}</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={row.kg}
                    onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, kg: e.target.value } : r))}
                    placeholder="—"
                    style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={row.reps}
                    onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, reps: e.target.value } : r))}
                    placeholder={ex.target?.reps ?? "—"}
                    style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={row.effort}
                    onChange={(e) => setSheetRows((prev) => prev.map((r) => r.setNumber === row.setNumber ? { ...r, effort: e.target.value } : r))}
                    placeholder={ex.target?.intensityTarget ?? "—"}
                    style={{ textAlign: "center", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text)", width: "100%", outline: "none" }}
                  />
                  {row.existingId ? (
                    <button
                      onClick={() => deleteSet(row.setNumber)}
                      style={{ width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                    >
                      Borrar
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={() => setLoggerOpen(false)}>
                Volver
              </Button>
              <Button size="lg" style={{ flex: 2 }} disabled={sheetSaving} onClick={saveSheet} icon="check">
                {sheetSaving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {warmupExists && !warmupDone && (
        <WarmupOverlay
          elapsedMs={warmupElapsedMs}
          targetMs={warmupTargetMs}
          notes={session.workoutTemplate?.warmupNotes}
          exercises={warmupExercises}
          running={warmupTimer.runningSince != null}
          onToggle={toggleWarmup}
          onReset={resetWarmup}
          onDone={finishWarmup}
        />
      )}

      {/* Rest timer overlay */}
      {restSeconds != null && restSeconds > 0 && (
        <RestTimerOverlay
          seconds={restSeconds}
          total={restTotal}
          nextEx={nextEx}
          onSkip={() => setRestSeconds(null)}
          onAdjust={(delta) => setRestSeconds((s) => s != null ? Math.max(1, s + delta) : null)}
        />
      )}

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

      {mediaOpen && ex?.media?.length > 0 && (
        <MediaLightbox media={ex.media} onClose={() => setMediaOpen(false)} />
      )}

      {swapOpen && ex && (
        <SwapSheet ex={ex} sessionId={sessionId} onSwapped={() => load()} onClose={() => setSwapOpen(false)} />
      )}

      {/* ── Confirm reset modal ── */}
      {showReset && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1200 }}
          onClick={() => setShowReset(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "24px 20px 36px" }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Reiniciar entrenamiento</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 20, lineHeight: 1.5 }}>
              Se descartará el progreso actual y empezarás desde cero. Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={() => setShowReset(false)}>
                Cancelar
              </Button>
              <button
                onClick={() => { setShowReset(false); resetSession(); }}
                disabled={resetting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "var(--danger)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              >
                {resetting ? "Reiniciando…" : "Sí, reiniciar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-exercise alternative picker ── */}
      {preSelectExIdx !== null && session?.exercises[preSelectExIdx] && (() => {
        const target = session.exercises[preSelectExIdx]!;
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1100 }}
            onClick={() => { setPreSelectExIdx(null); confirmGoToEx(preSelectExIdx); }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 540, background: "var(--bg-1)", borderRadius: "16px 16px 0 0", padding: "20px 16px 36px" }}
            >
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>¿Cuál vas a hacer?</div>
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 16 }}>Elegí el ejercicio para esta serie</div>

              {/* Current exercise */}
              <button
                onClick={() => confirmGoToEx(preSelectExIdx)}
                style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid var(--line)", background: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lime)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{target.exercise.name}</div>
                  <div style={{ fontSize: 11, color: "var(--lime)", marginTop: 1 }}>Principal</div>
                </div>
                <Icon name="chevR" size={14} color="var(--text-mute)" />
              </button>

              {/* Alternatives */}
              {target.alternatives.map((alt) => (
                <button
                  key={alt.exerciseId}
                  onClick={async () => {
                    setPreSelectExIdx(null);
                    await api.patch(`/client/sessions/${sessionId}/exercises/${target.id}`, { swapExerciseId: alt.exerciseId });
                    await load();
                    confirmGoToEx(preSelectExIdx!);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 0", border: "none", borderBottom: "1px solid var(--line)", background: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bg-3)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{alt.name}</div>
                    {alt.primaryMuscle && <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>{MUSCLE_LABEL[alt.primaryMuscle] ?? alt.primaryMuscle}</div>}
                  </div>
                  <Icon name="chevR" size={14} color="var(--text-mute)" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
