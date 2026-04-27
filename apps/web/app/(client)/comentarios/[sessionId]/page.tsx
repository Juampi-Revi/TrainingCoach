"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Icon, StateBlock, Tabs } from "@/components/ui";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import type { Comment, SessionDetail } from "@regen/types";

type Tab = "Sesión" | "Por ejercicio";

function readKey(sessionId: string) {
  return `regen_msg_read_${sessionId}`;
}

export default function ComentariosPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Sesión");
  const [selectedExIdx, setSelectedExIdx] = useState<number | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      try { window.localStorage.setItem(readKey(sessionId), new Date().toISOString()); } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments, tab]);

  async function sendComment() {
    if (!newMsg.trim()) return;
    setSending(true);
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
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando comentarios…" />
      </div>
    );
  }

  const sessionTitle = session.workoutTemplate?.title ?? "Sesión";
  const sessionDate = new Date(session.performedAt).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const coachName =
    comments.find((c) => c.author.role === "coach")?.author.name ?? "Coach";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "44px 16px 10px",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => {
              if (tab === "Por ejercicio" && selectedExIdx !== null) {
                setSelectedExIdx(null);
              } else {
                router.back();
              }
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <Icon name="chevL" size={18} />
          </button>
          <Tabs
            variant="pills"
            tabs={["Sesión", "Por ejercicio"]}
            active={tab}
            onChange={(t) => { setTab(t as Tab); setSelectedExIdx(null); }}
          />
          <div style={{ width: 36 }} />
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-.01em",
            marginTop: 4,
            paddingLeft: 4,
          }}
        >
          {sessionTitle} · {sessionDate}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-mute)",
            paddingLeft: 4,
            marginTop: 2,
          }}
        >
          {tab === "Sesión"
            ? `Thread con ${coachName}`
            : selectedExIdx !== null
            ? `Comentarios · ${session.exercises[selectedExIdx]?.exercise.name}`
            : "Elegí un ejercicio para comentar"}
        </div>
      </div>

      {/* ── TAB: Sesión ── */}
      {tab === "Sesión" && (
        <>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Context pill */}
            <div
              style={{
                alignSelf: "center",
                padding: "4px 10px",
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              Comentarios · {session.status === "completed" ? "sesión completa" : "en curso"}
            </div>

            {comments.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--text-mute)",
                  marginTop: 16,
                }}
              >
                Aún no hay comentarios. Sé el primero en escribir.
              </div>
            )}

            {comments.map((m) => {
              const isMe = m.author.id === user?.id;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-end",
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
                        marginBottom: 3,
                        display: "flex",
                        gap: 6,
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {isMe ? "Vos" : (m.author.name ?? m.author.role)}
                      </span>
                      <span>·</span>
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
                        background: isMe ? "var(--lime)" : "var(--bg-1)",
                        color: isMe ? "#0B0B0C" : "var(--text)",
                        border: isMe ? "none" : "1px solid var(--line)",
                        borderRadius: isMe
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                        fontSize: 14,
                        lineHeight: 1.45,
                        fontWeight: 500,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div
            style={{
              flexShrink: 0,
              padding: "12px 14px 32px",
              background: "var(--bg)",
              borderTop: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendComment();
                  }
                }}
                placeholder={`Responder a ${coachName}…`}
                style={{
                  flex: 1,
                  height: 44,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 22,
                  padding: "0 16px",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <button
                onClick={sendComment}
                disabled={sending || !newMsg.trim()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: newMsg.trim() ? "var(--lime)" : "var(--bg-2)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: newMsg.trim() ? "#0B0B0C" : "var(--text-mute)",
                  cursor: newMsg.trim() ? "pointer" : "default",
                  transition: "background .15s",
                }}
              >
                <Icon name="send" size={18} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Por ejercicio — lista ── */}
      {tab === "Por ejercicio" && selectedExIdx === null && (
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 28px" }}>
          {session.exercises.map((ex, i) => {
            const exComments = comments.filter((c) =>
              c.text.toLowerCase().includes(ex.exercise.name.toLowerCase())
            );
            const count = exComments.length;
            const lastComment = exComments[exComments.length - 1];
            return (
              <div
                key={ex.id}
                onClick={() => setSelectedExIdx(i)}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  marginBottom: 8,
                  background: "transparent",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
                className="ta-row"
              >
                <div
                  className="ta-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-mute)",
                    width: 18,
                    paddingTop: 2,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {ex.exercise.name}
                  </div>
                  {lastComment ? (
                    <div
                      className="ta-ellipsis"
                      style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}
                    >
                      {lastComment.author.role === "coach" ? "Coach" : "Vos"}:{" "}
                      &ldquo;{lastComment.text}&rdquo;
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        marginTop: 3,
                        fontStyle: "italic",
                      }}
                    >
                      Sin comentarios
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {count > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        background: "var(--bg-2)",
                        borderRadius: 999,
                      }}
                    >
                      <Icon name="msg" size={11} color="var(--text-mute)" />
                      <span
                        className="ta-mono"
                        style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}
                      >
                        {count}
                      </span>
                    </div>
                  ) : (
                    <Icon name="plus" size={14} color="var(--text-mute)" />
                  )}
                  <Icon name="chevR" size={14} color="var(--text-mute)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: Por ejercicio — thread específico ── */}
      {tab === "Por ejercicio" && selectedExIdx !== null && (() => {
        const ex = session.exercises[selectedExIdx];
        if (!ex) return null;
        const exComments = comments.filter((c) =>
          c.text.toLowerCase().includes(ex.exercise.name.toLowerCase())
        );

        return (
          <>
            {/* Exercise context badge */}
            <div
              style={{
                padding: "10px 16px",
                background: "var(--bg-1)",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: "4px 10px",
                  background: "rgba(215,255,58,.12)",
                  border: "1px solid rgba(215,255,58,.3)",
                  borderRadius: 999,
                  fontSize: 10,
                  color: "var(--lime)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                {ex.exercise.name}
              </div>
              {ex.target && (
                <span
                  className="ta-mono"
                  style={{ fontSize: 11, color: "var(--text-mute)" }}
                >
                  {ex.target.sets && ex.target.reps
                    ? `${ex.target.sets} × ${ex.target.reps}`
                    : ""}
                  {ex.target.intensityTarget
                    ? ` @ ${ex.target.intensityType ?? ""} ${ex.target.intensityTarget}`
                    : ""}
                </span>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {exComments.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-mute)",
                    marginTop: 16,
                  }}
                >
                  Sin comentarios para este ejercicio. Escribí uno.
                </div>
              )}
              {exComments.map((m) => {
                const isMe = m.author.id === user?.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-end",
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
                          padding: "10px 12px",
                          background: isMe ? "var(--lime)" : "var(--bg-1)",
                          color: isMe ? "#0B0B0C" : "var(--text)",
                          border: isMe ? "none" : "1px solid var(--line)",
                          borderRadius: isMe
                            ? "14px 14px 4px 14px"
                            : "14px 14px 14px 4px",
                          fontSize: 14,
                          lineHeight: 1.45,
                          fontWeight: 500,
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div
              style={{
                flexShrink: 0,
                padding: "12px 14px 32px",
                background: "var(--bg)",
                borderTop: "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendComment();
                    }
                  }}
                  placeholder={`Comentar sobre ${ex.exercise.name}…`}
                  style={{
                    flex: 1,
                    height: 44,
                    background: "var(--bg-2)",
                    border: "1px solid var(--line-2)",
                    borderRadius: 22,
                    padding: "0 16px",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendComment}
                  disabled={sending || !newMsg.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: newMsg.trim() ? "var(--lime)" : "var(--bg-2)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: newMsg.trim() ? "#0B0B0C" : "var(--text-mute)",
                    cursor: newMsg.trim() ? "pointer" : "default",
                    transition: "background .15s",
                  }}
                >
                  <Icon name="send" size={18} />
                </button>
              </div>
            </div>
          </>
        );
      })()}
      <MobileTabBar active="messages" />
    </div>
  );
}
