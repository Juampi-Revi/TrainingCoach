"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Button, Icon, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

type RefPayload = {
  kind: "session" | "workoutTemplate";
  id: string;
  label?: string;
};

type ChatMessageItem = {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string };
  reference: RefPayload | null;
};

type ChatResponse = {
  thread: { id: string };
  client: { id: string; name: string };
  messages: ChatMessageItem[];
};

type ClientDetailResponse = {
  client: { id: string; email: string; name: string | null };
  recentSessions: Array<{
    id: string;
    performedAt: string;
    workoutTemplate: { id: string; title: string } | null;
  }>;
};

export default function CoachChatPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { clientUserId } = useParams<{ clientUserId: string }>();

  const [clientName, setClientName] = useState("Alumno");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [ref, setRef] = useState<RefPayload | null>(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ClientDetailResponse["recentSessions"]>([]);
  const [refDetail, setRefDetail] = useState<RefPayload | null>(null);
  const [refDetailData, setRefDetailData] = useState<any | null | undefined>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 900px)");
    const apply = () => setIsDesktop(mql.matches);
    const t = window.setTimeout(apply, 0);
    mql.addEventListener("change", apply);
    return () => {
      window.clearTimeout(t);
      mql.removeEventListener("change", apply);
    };
  }, []);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
  }, []);

  const load = useCallback(() => {
    api
      .get<ChatResponse>(`/coach/chat/${clientUserId}?take=200`)
      .then((r) => {
        setClientName(r.client.name ?? "Alumno");
        setMessages(r.messages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api, clientUserId]);

  useEffect(() => {
    load();

    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    if (stickToBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`regen_chat_read_${clientUserId}`, new Date().toISOString());
    } catch {}
  }, [clientUserId, messages.length]);

  function openRefDetail(next: RefPayload) {
    setRefDetailData(undefined);
    setRefDetail(next);
  }

  useEffect(() => {
    if (!refDetail) return;
    if (refDetail.kind === "session") {
      api
        .get(`/coach/clients/${clientUserId}/sessions/${refDetail.id}`)
        .then(setRefDetailData)
        .catch(() => setRefDetailData(null));
      return;
    }
    api
      .get(`/coach/workouts/${refDetail.id}`)
      .then(setRefDetailData)
      .catch(() => setRefDetailData(null));
  }, [api, clientUserId, refDetail]);

  useEffect(() => {
    if (!refPickerOpen) return;
    if (recentSessions.length > 0) return;
    api
      .get<ClientDetailResponse>(`/coach/clients/${clientUserId}`)
      .then((r) => setRecentSessions(r.recentSessions ?? []))
      .catch(() => {});
  }, [api, clientUserId, recentSessions.length, refPickerOpen]);

  async function send() {
    if (!newMsg.trim()) return;
    setSending(true);
    stickToBottomRef.current = true;
    try {
      await api.post(`/coach/chat/${clientUserId}`, {
        text: newMsg.trim(),
        reference: ref ? { kind: ref.kind, id: ref.id, label: ref.label } : undefined,
      });
      setNewMsg("");
      setRef(null);
      load();
    } catch {
    } finally {
      setSending(false);
    }
  }

  const coachName = user?.name ?? "Coach";

  return (
    <DesktopShell
      active="messages"
      title="Mensajes"
      subtitle={`Chat con ${clientName}`}
      coachName={coachName}
      actions={
        <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/mensajes")}>
          Volver
        </Button>
      }
    >
      {loading ? (
        <div style={{ padding: 28 }}>
          <StateBlock kind="loading" title="Cargando chat…" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 70px)" }}>
          <div
            ref={listRef}
            onScroll={() => {
              stickToBottomRef.current = isNearBottom();
            }}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-mute)", marginTop: 16 }}>
                Aún no hay mensajes. Escribile a tu alumno.
              </div>
            )}

            {messages.map((m) => {
              const isMe = m.author.id === user?.id;
              const authorName = isMe ? "Vos" : (m.author.name ?? m.author.role);
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
                  <Avatar name={authorName} size={28} tone={isMe ? "var(--lime)" : "#7AB8FF"} />
                  <div style={{ maxWidth: 420 }}>
                    <div style={{ fontSize: 10, color: "var(--text-mute)", marginBottom: 3, display: "flex", gap: 6, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      <span style={{ fontWeight: 600 }}>{authorName}</span>
                      <span>·</span>
                      <span className="ta-mono">
                        {new Date(m.createdAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {m.reference && (
                      <button
                        onClick={() => openRefDetail(m.reference as RefPayload)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 10px",
                          background: "var(--bg-2)",
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                          marginBottom: 6,
                          cursor: "pointer",
                          color: "var(--text)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name="book" size={14} color="var(--text-mute)" />
                          <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
                            {m.reference.kind === "session" ? "Sesión" : "Entrenamiento"}{m.reference.label ? ` · ${m.reference.label}` : ""}
                          </div>
                        </div>
                      </button>
                    )}
                    <div
                      style={{
                        padding: "10px 12px",
                        background: isMe ? "var(--lime)" : "var(--bg-1)",
                        color: isMe ? "#0B0B0C" : "var(--text)",
                        border: isMe ? "none" : "1px solid var(--line)",
                        borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        fontSize: 14,
                        lineHeight: 1.45,
                        fontWeight: 500,
                        whiteSpace: "pre-wrap",
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

          <div style={{ flexShrink: 0, padding: 18, borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
            {ref && (
              <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-1)" }}>
                  <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
                    {ref.kind === "session" ? "Sesión" : "Entrenamiento"}{ref.label ? ` · ${ref.label}` : ""}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setRef(null)} style={{ height: 36 }}>
                  Quitar
                </Button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <Button variant="secondary" onClick={() => setRefPickerOpen(true)} style={{ height: 44, padding: "0 12px" }}>
                <Icon name="book" size={16} />
              </Button>
              <textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Escribí un mensaje…"
                rows={1}
                style={{
                  flex: 1,
                  resize: "none",
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "12px 12px",
                  color: "var(--text)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  lineHeight: 1.35,
                  outline: "none",
                  minHeight: 44,
                  maxHeight: 120,
                }}
              />
              <Button onClick={send} disabled={!newMsg.trim() || sending} style={{ height: 44, padding: "0 16px", fontWeight: 700 }}>
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {refPickerOpen && (
        <div
          onClick={() => setRefPickerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 2000,
            padding: "0 14px 14px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 14,
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Referenciar (sesiones recientes)</div>
              <button onClick={() => setRefPickerOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-mute)" }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-mute)" }}>No hay sesiones recientes.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentSessions.slice(0, 10).map((s) => {
                  const title = s.workoutTemplate?.title ?? "Sesión libre";
                  const date = new Date(s.performedAt).toLocaleDateString("es", { day: "2-digit", month: "short" });
                  return (
                    <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 10, background: "var(--bg)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                        <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</div>
                        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", flexShrink: 0 }}>{date}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRef({ kind: "session", id: s.id, label: `${title} · ${date}` });
                            setRefPickerOpen(false);
                          }}
                          style={{ height: 34 }}
                        >
                          Sesión
                        </Button>
                      {s.workoutTemplate?.id && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRef({ kind: "workoutTemplate", id: s.workoutTemplate!.id, label: title });
                            setRefPickerOpen(false);
                          }}
                          style={{ height: 34 }}
                        >
                          Entrenamiento
                        </Button>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {refDetail && (
        <div
          onClick={() => setRefDetail(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            display: "flex",
            alignItems: isDesktop ? "stretch" : "flex-end",
            justifyContent: isDesktop ? "flex-end" : "center",
            zIndex: 2000,
            padding: isDesktop ? 0 : "0 14px 14px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: isDesktop ? 480 : "100%",
              maxWidth: isDesktop ? 480 : 560,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: isDesktop ? "16px 0 0 16px" : 16,
              padding: 14,
              maxHeight: isDesktop ? "100vh" : "70vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {refDetail.kind === "session" ? "Sesión" : "Entrenamiento"}
              </div>
              <button onClick={() => setRefDetail(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-mute)" }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {refDetailData === undefined ? (
              <StateBlock kind="loading" title="Cargando…" />
            ) : refDetailData ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-.01em", color: "var(--text)" }}>
                  {refDetailData.title ?? refDetailData.workoutTemplate?.title ?? refDetail.label ?? "Detalle"}
                </div>
                {refDetail.kind === "session" && refDetailData.performedAt && (
                  <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>
                    {new Date(refDetailData.performedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
                {refDetail.kind === "workoutTemplate" && (refDetailData.warmupMinutes || refDetailData.tags?.length) && (
                  <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {!!refDetailData.warmupMinutes && (
                      <span className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                        Warmup {refDetailData.warmupMinutes}m
                      </span>
                    )}
                    {(refDetailData.tags ?? []).slice(0, 4).map((t: string) => (
                      <span key={t} className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                {!!refDetailData.description && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-mute)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                    {refDetailData.description}
                  </div>
                )}
                {!!refDetailData.warmupNotes && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-mute)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                    {refDetailData.warmupNotes}
                  </div>
                )}
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {(refDetailData.exercises ?? []).slice(0, 20).map((ex: any) => (
                    <div key={ex.id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                      <div className="ta-ellipsis" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                        {ex.exercise?.name ?? ex.performedExercise?.name ?? ex.workoutExercise?.exercise?.name ?? ex.name ?? "Ejercicio"}
                      </div>
                      {refDetail.kind === "session" ? (
                        <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                          {ex.sets?.length ? `${ex.sets.length} serie${ex.sets.length !== 1 ? "s" : ""}` : "—"}
                          {ex.target?.reps ? ` · ${ex.target.reps} reps` : ""}
                        </div>
                      ) : (
                        <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                          {ex.targetSets ? `${ex.targetSets} series` : "—"}
                          {ex.targetReps ? ` · ${ex.targetReps} reps` : ""}
                          {ex.intensityType && ex.intensityTarget ? ` · ${String(ex.intensityType).toUpperCase()} ${ex.intensityTarget}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-mute)" }}>No se pudo cargar el detalle.</div>
            )}
          </div>
        </div>
      )}
    </DesktopShell>
  );
}
