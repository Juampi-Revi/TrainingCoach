"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Avatar, Badge, Button, Icon, StateBlock, Tabs } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { SessionDetail, Comment } from "@regen/types";

export default function CoachSessionDetailPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { clientUserId, sessionId } = useParams<{
    clientUserId: string;
    sessionId: string;
  }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentTab, setCommentTab] = useState("Sesión");
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const load = useCallback(() => {
    Promise.all([
      api.get<SessionDetail>(`/coach/clients/${clientUserId}/sessions/${sessionId}`),
      api.get<Comment[]>(`/sessions/${sessionId}/comments`),
    ])
      .then(([s, c]) => {
        setSession(s);
        setComments(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, clientUserId, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments, commentTab]);

  useEffect(() => {
    const isNearBottom = () =>
      typeof window !== "undefined" &&
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
          if (prev.length === c.length && prevLastId && prevLastId === nextLastId) return prev;
          return c;
        });
      } catch {}
    };

    const interval = window.setInterval(tick, 5000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [api, sessionId]);

  async function sendComment() {
    if (!newMsg.trim()) return;
    setSending(true);
    stickToBottomRef.current = true;
    try {
      const c = await api.post<Comment>(`/sessions/${sessionId}/comments`, {
        text: newMsg.trim(),
      });
      setComments((prev) => [...prev, c]);
      setNewMsg("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  if (loading || !session) {
    return (
      <DesktopShell active="athletes" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="loading" title="Cargando sesión…" />
      </DesktopShell>
    );
  }

  const perfAt = new Date(session.performedAt);
  const dateStr = perfAt.toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const totalVol = session.exercises.reduce(
    (acc, e) =>
      acc +
      e.sets.reduce(
        (a, s) => a + (Number(s.reps ?? 0) * Number(s.weight ?? 0)),
        0
      ),
    0
  );

  return (
    <DesktopShell
      active="athletes"
      title={
        <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
          Alumnos <span style={{ margin: "0 8px" }}>/</span>{" "}
          <span
            onClick={() => router.push(`/coach/alumnos/${clientUserId}`)}
            style={{ cursor: "pointer" }}
          >
            Alumno
          </span>
          <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>
            {session.workoutTemplate?.title ?? "Sesión"} · {dateStr}
          </span>
        </span>
      }
      subtitle={`${session.status === "completed" ? "Completada" : "En curso"} · Volumen ${Math.round(totalVol).toLocaleString("es")} kg`}
      coachName={user?.name ?? "Coach"}
      actions={
        <Button
          variant="outline"
          size="sm"
          icon="chevL"
          onClick={() => router.push(`/coach/alumnos/${clientUserId}`)}
        >
          Volver
        </Button>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          height: "calc(100vh - 74px)",
        }}
      >
        {/* Left: exercises */}
        <div
          style={{
            padding: "20px 20px 20px 28px",
            overflow: "auto",
            borderRight: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {session.status === "completed" && (
              <Badge tone="success" icon="check">Completa</Badge>
            )}
            {session.energyRating && (
              <Badge tone="limeSoft">Energía {session.energyRating}/10</Badge>
            )}
          </div>

          {session.sessionNotes && (
            <div
              style={{
                padding: 12,
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                borderLeft: "3px solid var(--lime)",
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--lime)",
                  textTransform: "uppercase",
                  letterSpacing: ".1em",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Nota del alumno
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{session.sessionNotes}</div>
            </div>
          )}

          {session.exercises.map((ex, ei) => (
            <div
              key={ex.id}
              style={{
                marginBottom: 12,
                padding: 16,
                background: "var(--bg-1)",
                border: "1px solid var(--line)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  className="ta-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-mute)",
                    width: 22,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {String(ei + 1).padStart(2, "0")}
                </div>
                {ex.exercise.thumbnailUrl && (
                  <Image
                    unoptimized
                    src={ex.exercise.thumbnailUrl}
                    alt={ex.exercise.name}
                    width={40}
                    height={40}
                    style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "var(--bg-3)" }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{ex.exercise.name}</div>
                  {ex.target && (
                    <div
                      className="ta-mono"
                      style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}
                    >
                      Target ·{" "}
                      {[
                        ex.target.sets && ex.target.reps
                          ? `${ex.target.sets} × ${ex.target.reps}`
                          : null,
                        ex.target.intensityTarget
                          ? `@ ${ex.target.intensityType ?? ""} ${ex.target.intensityTarget}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                  )}
                </div>
              </div>

              {ex.sets.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(ex.sets.length, 4)}, 1fr)`,
                    gap: 6,
                  }}
                >
                  {ex.sets.map((s, si) => {
                    const rpe = Number(s.rpe ?? 0);
                    const over = rpe > 8.5;
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: 10,
                          background: "var(--bg-2)",
                          border: `1px solid ${over ? "rgba(255,181,71,.4)" : "var(--line)"}`,
                          borderRadius: 8,
                        }}
                      >
                        <div
                          className="ta-mono"
                          style={{
                            fontSize: 10,
                            color: "var(--text-mute)",
                            fontWeight: 600,
                          }}
                        >
                          SERIE {si + 1}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 4,
                            marginTop: 4,
                          }}
                        >
                          <span
                            className="ta-mono"
                            style={{ fontSize: 15, fontWeight: 600 }}
                          >
                            {s.reps ?? "—"}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-mute)" }}>×</span>
                          <span
                            className="ta-mono"
                            style={{ fontSize: 15, fontWeight: 600 }}
                          >
                            {s.weight ?? "—"}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-mute)" }}>kg</span>
                        </div>
                        {(s.rpe || s.rir) && (
                          <div
                            className="ta-mono"
                            style={{
                              fontSize: 10,
                              color: over ? "var(--warn)" : "var(--text-mute)",
                              marginTop: 2,
                            }}
                          >
                            {s.rpe ? `RPE ${s.rpe}` : `RIR ${s.rir}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{ fontSize: 12, color: "var(--text-mute)", fontStyle: "italic" }}
                >
                  Sin series registradas
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: comments */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--bg-1)",
            height: "100%",
          }}
        >
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid var(--line)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Comentarios</div>
              <Tabs
                variant="pills"
                tabs={["Sesión", "Ejercicios"]}
                active={commentTab}
                onChange={setCommentTab}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {comments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--text-mute)",
                  marginTop: 24,
                }}
              >
                Aún no hay comentarios
              </div>
            ) : (
              comments.map((m) => {
                const isMe = m.author.id === user?.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      gap: 10,
                      flexDirection: isMe ? "row-reverse" : "row",
                    }}
                  >
                    <Avatar
                      name={m.author.name ?? m.author.role}
                      size={28}
                      tone={isMe ? "var(--lime)" : "#7AB8FF"}
                    />
                    <div style={{ maxWidth: 260 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-mute)",
                          marginBottom: 4,
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {isMe ? "Vos" : (m.author.name ?? m.author.role)}
                        </span>
                        {" · "}
                        <span className="ta-mono">
                          {new Date(m.createdAt).toLocaleTimeString("es", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "10px 12px",
                          background: isMe ? "var(--lime)" : "var(--bg-2)",
                          color: isMe ? "#0B0B0C" : "var(--text)",
                          borderRadius: isMe
                            ? "12px 4px 12px 12px"
                            : "4px 12px 12px 12px",
                          fontSize: 13,
                          lineHeight: 1.5,
                          fontWeight: 500,
                          border: isMe ? "none" : "1px solid var(--line)",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div
            style={{
              padding: 14,
              borderTop: "1px solid var(--line)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: 10,
                background: "var(--bg-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Escribí un feedback…"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendComment();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.5,
                  resize: "none",
                  width: "100%",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  size="sm"
                  icon="send"
                  disabled={sending || !newMsg.trim()}
                  onClick={sendComment}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}
