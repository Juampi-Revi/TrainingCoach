"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Badge, Icon, StateBlock, Tabs } from "@/components/ui";
import type { Comment, SessionDetail, SessionExercise, WorkoutSet } from "@regen/types";

type Tab = "Detalle" | "Mensajes";

function parseManualMeta(sessionNotes: string | null) {
  if (!sessionNotes) return { title: null as string | null, type: null as string | null };
  const lines = sessionNotes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title: string | null = null;
  let type: string | null = null;
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.startsWith("actividad:")) title = line.slice("actividad:".length).trim() || null;
    if (low.startsWith("tipo:")) type = line.slice("tipo:".length).trim() || null;
  }
  return { title, type };
}

function fmtMinutes(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}h${mm ? ` ${mm}m` : ""}`;
  return `${m}m`;
}

function equipLabel(notes: string | null): string | null {
  if (notes === "barra") return "Barra";
  if (notes === "mancuernas") return "Mancu.";
  if (notes === "maquina") return "Máq.";
  return null;
}

// ─── Set row display ──────────────────────────────────────────────────────────

function SetDetail({ set }: { set: WorkoutSet }) {
  const effort = set.rpe != null
    ? `RPE ${set.rpe}`
    : set.rir != null
    ? `RIR ${set.rir}`
    : null;
  const equip = equipLabel(set.notes);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "28px 1fr 1fr 60px",
      gap: 6, alignItems: "center",
      padding: "6px 0",
      borderBottom: "1px solid var(--line)",
    }}>
      <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700 }}>
        {set.setNumber}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="ta-mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
          {set.weight ?? "—"}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>kg</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="ta-mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
          {set.reps ?? "—"}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>rep</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
        {effort && (
          <span className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", fontWeight: 700 }}>
            {effort}
          </span>
        )}
        {equip && (
          <span className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 600 }}>
            {equip}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Exercise detail card ─────────────────────────────────────────────────────

function ExerciseCard({
  ex,
  index,
  onComment,
}: {
  ex: SessionExercise;
  index: number;
  onComment: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasData = ex.sets.length > 0;

  return (
    <div style={{
      border: "1px solid var(--line)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 10,
    }}>
      {/* Exercise header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", background: "var(--bg-1)",
          border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, flexShrink: 0, width: 22 }}>
          {String(index + 1).padStart(2, "0")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ex.exercise.name}
          </div>
          {ex.target && (
            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 1 }}>
              {[
                ex.target.sets && ex.target.reps ? `${ex.target.sets} × ${ex.target.reps}` : null,
                ex.target.intensityTarget ? `${ex.target.intensityType?.toUpperCase() ?? ""} ${ex.target.intensityTarget}` : null,
              ].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span className="ta-mono" style={{
            fontSize: 11, fontWeight: 700,
            color: hasData ? "var(--success)" : "var(--text-dim)",
          }}>
            {ex.sets.length}/{ex.target?.sets ?? "—"}
          </span>
          {hasData && <Icon name="check" size={12} color="var(--success)" />}
          <Icon name={expanded ? "chevL" : "chevR"} size={12} color="var(--text-mute)" />
        </div>
      </button>

      {/* Sets detail */}
      {expanded && (
        <div style={{ padding: "0 14px 10px", background: "var(--bg)" }}>
          {!hasData ? (
            <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "10px 0", fontStyle: "italic" }}>
              Sin series registradas
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{
                display: "grid", gridTemplateColumns: "28px 1fr 1fr 60px",
                gap: 6, padding: "8px 0 4px",
                fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase",
                letterSpacing: ".08em", fontWeight: 800,
              }}>
                <div>#</div>
                <div>Peso</div>
                <div>Reps</div>
                <div style={{ textAlign: "right" }}>Esfuerzo</div>
              </div>
              {ex.sets.map((s) => <SetDetail key={s.id} set={s} />)}
            </>
          )}

          {/* Comment button */}
          <button
            onClick={(e) => { e.stopPropagation(); onComment(); }}
            style={{
              marginTop: 10, display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 8,
              border: "1px solid var(--line-2)", background: "transparent",
              color: "var(--text-mute)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Icon name="msg" size={13} color="var(--text-mute)" />
            Comentar con el coach
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComentariosPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Detalle");
  const [selectedEx, setSelectedEx] = useState<SessionExercise | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const load = useCallback(() => {
    Promise.all([
      api.get<SessionDetail>(`/client/sessions/${sessionId}`),
      api.get<Comment[]>(`/sessions/${sessionId}/comments`),
    ])
      .then(([s, c]) => { setSession(s); setComments(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, sessionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      try { window.localStorage.setItem(`regen_msg_read_${sessionId}`, new Date().toISOString()); } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [sessionId]);

  useEffect(() => {
    if (tab === "Mensajes") {
      if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, tab]);

  useEffect(() => {
    if (tab !== "Mensajes") return;
    const isNearBottom = () =>
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 120;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      stickToBottomRef.current = isNearBottom();
      try {
        const c = await api.get<Comment[]>(`/sessions/${sessionId}/comments`);
        if (cancelled) return;
        setComments((prev) => {
          const prevLastId = prev[prev.length - 1]?.id;
          const nextLastId = c[c.length - 1]?.id;
          if (prev.length === c.length && prevLastId === nextLastId) return prev;
          return c;
        });
      } catch {}
    };
    const interval = window.setInterval(tick, 5000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [api, sessionId, tab]);

  async function sendComment() {
    if (!newMsg.trim()) return;
    setSending(true);
    stickToBottomRef.current = true;
    const prefix = selectedEx ? `[${selectedEx.exercise.name}] ` : "";
    try {
      const c = await api.post<Comment>(`/sessions/${sessionId}/comments`, {
        text: prefix + newMsg.trim(),
      });
      setComments((prev) => [...prev, c]);
      setNewMsg("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  function goToMessages(ex?: SessionExercise) {
    setSelectedEx(ex ?? null);
    setTab("Mensajes");
  }

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando sesión…" />
      </div>
    );
  }

  const manualMeta = parseManualMeta(session.sessionNotes);
  const sessionTitle = session.workoutTemplate?.title ?? manualMeta.title ?? "Sesión";
  const sessionDate = new Date(session.performedAt).toLocaleDateString("es", {
    weekday: "short", day: "numeric", month: "short",
  });
  const durationMs = session.completedAt
    ? new Date(session.completedAt).getTime() - new Date(session.performedAt).getTime()
    : null;
  const coachName = comments.find((c) => c.author.role === "coach")?.author.name ?? "Coach";
  const workExercises = session.exercises.filter((e) => !e.isWarmup);
  const totalSets = workExercises.reduce((acc, e) => acc + e.sets.length, 0);
  const targetSets = workExercises.reduce((acc, e) => acc + (e.target?.sets ?? 0), 0);
  const isComplete = targetSets > 0 && totalSets >= targetSets;

  const filteredComments = selectedEx
    ? comments.filter((c) => c.text.includes(`[${selectedEx.exercise.name}]`))
    : comments.filter((c) => !c.text.match(/^\[.+\] /));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ padding: "44px 16px 10px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button
            onClick={() => {
              if (tab === "Mensajes" && selectedEx) {
                setSelectedEx(null);
              } else if (tab === "Mensajes") {
                setTab("Detalle");
              } else {
                router.back();
              }
            }}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--bg-1)", border: "1px solid var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text)",
            }}
          >
            <Icon name="chevL" size={18} />
          </button>
          <Tabs
            variant="pills"
            tabs={["Detalle", "Mensajes"]}
            active={tab}
            onChange={(t) => { setTab(t as Tab); setSelectedEx(null); }}
          />
          <div style={{ width: 36 }} />
        </div>
        <div style={{ paddingLeft: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.01em" }}>
            {sessionTitle}
          </div>
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".08em" }}>
            {sessionDate}
            {durationMs ? ` · ${fmtMinutes(durationMs)}` : ""}
            {session.energyRating ? ` · Energía ${Math.min(5, Math.ceil(session.energyRating / 2))}/5` : ""}
          </div>
        </div>
      </div>

      {/* ── TAB: Detalle ── */}
      {tab === "Detalle" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
              <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>SERIES</div>
              <div className="ta-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                {totalSets}{targetSets > 0 ? `/${targetSets}` : ""}
              </div>
            </div>
            <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
              <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>ESTADO</div>
              <div style={{ marginTop: 4 }}>
                {isComplete
                  ? <Badge tone="limeSoft" size="sm">Completado</Badge>
                  : targetSets > 0
                  ? <Badge tone="neutral" size="sm">Parcial</Badge>
                  : <Badge tone="neutral" size="sm">Libre</Badge>
                }
              </div>
            </div>
            {durationMs != null && (
              <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10 }}>
                <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>TIEMPO</div>
                <div className="ta-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{fmtMinutes(durationMs)}</div>
              </div>
            )}
          </div>

          {/* Exercise list */}
          {workExercises.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-mute)", fontSize: 13, padding: 24 }}>
              Sin ejercicios registrados
            </div>
          ) : (
            workExercises.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                index={i}
                onComment={() => goToMessages(ex)}
              />
            ))
          )}

          {/* Message about whole session */}
          <button
            onClick={() => goToMessages()}
            style={{
              width: "100%", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px", borderRadius: 12,
              border: "1px solid var(--line-2)", background: "transparent",
              color: "var(--text-mute)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Icon name="msg" size={15} color="var(--text-mute)" />
            Mensaje al coach sobre esta sesión
          </button>
        </div>
      )}

      {/* ── TAB: Mensajes ── */}
      {tab === "Mensajes" && (
        <>
          {/* Exercise context pill if filtered */}
          {selectedEx && (
            <div style={{
              padding: "8px 16px", background: "var(--bg-1)", borderBottom: "1px solid var(--line)",
              display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
              <div style={{
                padding: "4px 10px", borderRadius: 999,
                background: "rgba(215,255,58,.12)", border: "1px solid rgba(215,255,58,.3)",
                fontSize: 10, color: "var(--lime)", fontFamily: "var(--font-mono)",
                fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em",
              }}>
                {selectedEx.exercise.name}
              </div>
              {selectedEx.target && (
                <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                  {selectedEx.target.sets && selectedEx.target.reps
                    ? `${selectedEx.target.sets} × ${selectedEx.target.reps}`
                    : ""}
                  {selectedEx.target.intensityTarget
                    ? ` @ ${selectedEx.target.intensityType ?? ""} ${selectedEx.target.intensityTarget}`
                    : ""}
                </span>
              )}
              <button
                onClick={() => setSelectedEx(null)}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-mute)", fontSize: 12, fontWeight: 600 }}
              >
                Ver todo
              </button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              alignSelf: "center", padding: "4px 10px",
              background: "var(--bg-2)", border: "1px solid var(--line)",
              borderRadius: 999, fontSize: 10, color: "var(--text-mute)",
              textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600,
            }}>
              {selectedEx ? `Sobre ${selectedEx.exercise.name}` : "Sesión completa"}
            </div>

            {filteredComments.length === 0 && (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-mute)", marginTop: 16 }}>
                Sin mensajes aún. Escribile al {coachName}.
              </div>
            )}

            {filteredComments.map((m) => {
              const isMe = m.author.id === user?.id;
              const text = m.text.replace(/^\[.+?\] /, "");
              return (
                <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isMe ? "row-reverse" : "row" }}>
                  <Avatar name={m.author.name ?? m.author.role} size={28} tone={isMe ? "var(--lime)" : "#7AB8FF"} />
                  <div style={{ maxWidth: 260 }}>
                    <div style={{ fontSize: 10, color: "var(--text-mute)", marginBottom: 3, display: "flex", gap: 6, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      <span style={{ fontWeight: 600 }}>{isMe ? "Vos" : (m.author.name ?? m.author.role)}</span>
                      <span>·</span>
                      <span className="ta-mono">{new Date(m.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div style={{
                      padding: "10px 12px",
                      background: isMe ? "var(--lime)" : "var(--bg-1)",
                      color: isMe ? "#0B0B0C" : "var(--text)",
                      border: isMe ? "none" : "1px solid var(--line)",
                      borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      fontSize: 14, lineHeight: 1.45, fontWeight: 500,
                    }}>
                      {text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div style={{ flexShrink: 0, padding: "12px 14px 32px", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); }
                }}
                placeholder={selectedEx ? `Sobre ${selectedEx.exercise.name}…` : `Escribirle a ${coachName}…`}
                style={{
                  flex: 1, height: 44, background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  borderRadius: 22, padding: "0 16px", fontFamily: "var(--font-sans)",
                  fontSize: 13, color: "var(--text)", outline: "none",
                }}
              />
              <button
                onClick={sendComment}
                disabled={sending || !newMsg.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  background: newMsg.trim() ? "var(--lime)" : "var(--bg-2)",
                  border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  color: newMsg.trim() ? "#0B0B0C" : "var(--text-mute)",
                  cursor: newMsg.trim() ? "pointer" : "default", transition: "background .15s",
                }}
              >
                <Icon name="send" size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
