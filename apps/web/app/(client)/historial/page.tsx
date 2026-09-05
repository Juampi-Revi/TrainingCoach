"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Badge, Button, ConfirmModal, Icon, StateBlock, Tabs } from "@/components/ui";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import type { SessionDetail, SessionSummary } from "@regen/types";

type Filter = "Mes" | "Todo";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeEnergyRating(energyRating: number | null): number | null {
  if (energyRating == null) return null;
  if (!Number.isFinite(energyRating)) return null;
  if (energyRating <= 0) return null;
  const v = energyRating <= 5 ? Math.round(energyRating) : Math.ceil(energyRating / 2);
  return Math.min(5, Math.max(1, v));
}

function parseManualMeta(sessionNotes: string | null) {
  if (!sessionNotes) return { title: null as string | null, type: null as string | null, notes: null as string | null };
  const lines = sessionNotes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title: string | null = null;
  let type: string | null = null;
  const rest: string[] = [];
  for (const line of lines) {
    const low = line.toLowerCase();
    if (low.startsWith("actividad:")) { title = line.slice("actividad:".length).trim() || null; continue; }
    if (low.startsWith("tipo:")) { type = line.slice("tipo:".length).trim() || null; continue; }
    rest.push(line);
  }
  return { title, type, notes: rest.length ? rest.join("\n") : null };
}

function fmtMinutes(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
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

function getWeekStart(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function weekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const from = d.toLocaleDateString("es", opts);
  const to = end.toLocaleDateString("es", opts);
  return `${from} – ${to}`;
}

function groupByWeek(sessions: SessionSummary[]) {
  const map = new Map<string, SessionSummary[]>();
  const order: string[] = [];
  for (const s of sessions) {
    const ws = getWeekStart(new Date(s.performedAt));
    if (!map.has(ws)) { map.set(ws, []); order.push(ws); }
    map.get(ws)!.push(s);
  }
  return order.map((ws) => ({ weekStart: ws, label: weekLabel(ws), sessions: map.get(ws)! }));
}

// ─── Inline detail ────────────────────────────────────────────────────────────

function SessionDetailInline({ detail, loading, onMessages }: {
  detail: SessionDetail | null;
  loading: boolean;
  onMessages: () => void;
}) {
  if (loading) {
    return (
      <div style={{ padding: "14px 0", color: "var(--text-mute)", fontSize: 12 }}>
        Cargando…
      </div>
    );
  }
  if (!detail) return null;

  const workExercises = detail.exercises.filter((e) => e.block.type !== "warmup");

  return (
    <div style={{ paddingBottom: 12 }}>
      {workExercises.length === 0 ? (
        <div style={{ padding: "8px 0 4px", color: "var(--text-mute)", fontSize: 12 }}>
          Sin ejercicios registrados
        </div>
      ) : (
        workExercises.map((ex, i) => (
          <div key={ex.id} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--text-dim)",
              textTransform: "uppercase", letterSpacing: ".06em",
              marginBottom: 5,
              display: "flex", alignItems: "baseline", gap: 6,
            }}>
              <span className="ta-mono" style={{ color: "var(--text-mute)", fontSize: 10 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{ex.exercise.name}</span>
              {ex.exercise.primaryMuscle && (
                <span className="ta-mono" style={{ color: "var(--text-mute)", fontWeight: 400, fontSize: 10 }}>
                  {ex.exercise.primaryMuscle}
                </span>
              )}
            </div>

            {ex.sets.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-mute)", paddingLeft: 18 }}>Sin series</div>
            ) : (
              <div style={{ display: "grid", gap: 3 }}>
                {ex.sets.map((set) => {
                  const equip = equipLabel(set.notes);
                  const effort = set.rpe != null
                    ? `RPE ${set.rpe}`
                    : set.rir != null
                    ? `RIR ${set.rir}`
                    : null;
                  return (
                    <div key={set.id} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", background: "var(--bg-2)", borderRadius: 8,
                    }}>
                      <span className="ta-mono" style={{
                        fontSize: 10, color: "var(--text-mute)", width: 14, textAlign: "center", flexShrink: 0,
                      }}>
                        {set.setNumber}
                      </span>
                      <span className="ta-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", minWidth: 52 }}>
                        {set.weight != null ? `${set.weight} kg` : "— kg"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-mute)" }}>×</span>
                      <span className="ta-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                        {set.reps != null ? `${set.reps}` : "—"}
                        <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text-mute)" }}> rep</span>
                      </span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                        {equip && (
                          <span className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>
                            {equip}
                          </span>
                        )}
                        {effort && (
                          <span className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", fontWeight: 700 }}>
                            {effort}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}

      <button
        onClick={onMessages}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          width: "100%", padding: "9px 12px", marginTop: 4,
          borderRadius: 10, border: "1px solid var(--line-2)",
          background: "transparent", color: "var(--text-mute)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        <Icon name="msg" size={14} />
        Mensajes con el coach
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistorialPage() {
  const { api } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Mes");
  const [nowMs, setNowMs] = useState<number | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SessionDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualType, setManualType] = useState("Deporte");
  const [manualTitle, setManualTitle] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ items: SessionSummary[]; nextCursor: string | null }>("/client/sessions?limit=50");
      setSessions(r.items);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => {
      setNowMs(Date.now());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleExpand = useCallback(async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (details[id]) return;
    setLoadingDetailId(id);
    try {
      const d = await api.get<SessionDetail>(`/client/sessions/${id}`);
      setDetails((prev) => ({ ...prev, [id]: d }));
    } catch { /* ignore */ } finally {
      setLoadingDetailId(null);
    }
  }, [expandedId, details, api]);

  const openManual = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60_000);
    setManualType("Deporte");
    setManualTitle("");
    setManualNotes("");
    setManualStart(toLocalInputValue(now));
    setManualEnd(toLocalInputValue(end));
    setManualError(null);
    setManualOpen(true);
  };

  const saveManual = async () => {
    setManualSaving(true);
    setManualError(null);
    try {
      const perf = manualStart ? new Date(manualStart) : null;
      const comp = manualEnd ? new Date(manualEnd) : null;
      if (!perf || !Number.isFinite(perf.getTime())) throw new Error("Inicio inválido");
      if (!comp || !Number.isFinite(comp.getTime())) throw new Error("Fin inválido");
      if (comp.getTime() < perf.getTime()) throw new Error("La hora de fin no puede ser anterior al inicio");

      const title = manualTitle.trim();
      const notes = manualNotes.trim();
      const type = manualType.trim();
      const parts: string[] = [];
      if (title) parts.push(`Actividad: ${title}`);
      if (type) parts.push(`Tipo: ${type}`);
      if (notes) parts.push(notes);
      const sessionNotes = parts.length ? parts.join("\n") : null;

      const res = await api.post<{ id: string }>("/client/sessions", {
        status: "completed",
        performedAt: perf.toISOString(),
        completedAt: comp.toISOString(),
        sessionNotes,
      });

      setManualOpen(false);
      load();
      window.location.href = `/sesion/${res.id}/completada`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      setManualError(msg);
      setManualSaving(false);
    }
  };

    const completed = sessions.filter((s) => s.status === "completed" || s.status === "partial");
  const filtered =
    filter === "Mes" && nowMs != null
      ? completed.filter((s) => {
          const diff = (nowMs - new Date(s.performedAt).getTime()) / 86400000;
          return diff <= 30;
        })
      : completed;

  const weeks = groupByWeek(filtered);

  const deleteSession = async (sessionId: string) => {
    if (deletingId) return;
    setDeletingId(sessionId);
    try {
      await api.patch(`/client/sessions/${sessionId}`, { status: "discarded" });
      setSessions((prev) => prev.filter((x) => x.id !== sessionId));
      if (expandedId === sessionId) setExpandedId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PullToRefresh onRefresh={load}>
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 100 }}>
      <div style={{ padding: "48px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>Historial</div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
              {completed.length} sesiones completadas
            </div>
          </div>
          <Button size="lg" icon="plus" onClick={openManual}>
            Cargar actividad
          </Button>
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <Tabs
          variant="pills"
          tabs={["Mes", "Todo"]}
          active={filter}
          onChange={(t) => setFilter(t as Filter)}
        />
      </div>

      {loading ? (
        <StateBlock kind="loading" title="Cargando historial…" />
      ) : filtered.length === 0 ? (
        <StateBlock
          kind="empty"
          title="Sin sesiones"
          body="Completá tu primera sesión para verla acá."
          cta={
            <Link href="/semana" style={{ textDecoration: "none" }}>
              <Button size="sm">Ir a la semana</Button>
            </Link>
          }
        />
      ) : (
        <div style={{ padding: "0 20px" }}>
          {weeks.map(({ weekStart, label, sessions: ws }) => (
            <div key={weekStart} style={{ marginBottom: 24 }}>
              {/* Week header */}
              <div className="ta-mono" style={{
                fontSize: 10, fontWeight: 700, color: "var(--text-mute)",
                textTransform: "uppercase", letterSpacing: ".1em",
                padding: "6px 0 8px",
                borderBottom: "1px solid var(--line)",
                marginBottom: 4,
              }}>
                {label}
              </div>

              {ws.map((s) => {
                const d = new Date(s.performedAt);
                const dateStr = d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
                const manualMeta = parseManualMeta(s.sessionNotes);
                const title = s.workoutTemplate?.title ?? manualMeta.title ?? "Sesión libre";
                const isDeleting = deletingId === s.id;
                const durationMinutes = s.completedAt
                  ? (() => { const ms = new Date(s.completedAt).getTime() - new Date(s.performedAt).getTime(); return Number.isFinite(ms) && ms >= 0 ? ms / 60000 : null; })()
                  : null;
                const durationStr = durationMinutes != null ? fmtMinutes(durationMinutes) : null;
                const isManual = !s.workoutTemplate && (manualMeta.title || manualMeta.type);
                const energy = normalizeEnergyRating(s.energyRating);
                const isComplete = s.status === "completed";
                const isPartial = s.status === "partial";
                const metaParts: string[] = [];
                if (isManual) {
                  if (manualMeta.type) metaParts.push(manualMeta.type);
                } else {
                  metaParts.push(`${s.setsCount}${s.targetSetsCount > 0 ? `/${s.targetSetsCount}` : ""} series`);
                }
                if (durationStr) metaParts.push(durationStr);
                if (energy) metaParts.push(`Energía ${energy}/5`);

                const isExpanded = expandedId === s.id;
                const isLoadingThis = loadingDetailId === s.id;

                return (
                  <div key={s.id}>
                    {/* Session row */}
                    <div
                      style={{
                        display: "flex", gap: 12, padding: "12px 0",
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpand(s.id)}
                        style={{
                          display: "flex", gap: 12, flex: 1, minWidth: 0,
                          alignItems: "center", cursor: "pointer",
                          background: "none", border: "none", padding: 0,
                          color: "inherit", textAlign: "left", font: "inherit",
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: isExpanded ? "var(--lime)" : "var(--bg-2)",
                          border: `1px solid ${isExpanded ? "var(--lime)" : "var(--line)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isExpanded ? "var(--bg)" : "var(--lime)",
                          transition: "background .15s, border-color .15s",
                        }}>
                          <Icon name="check" size={18} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ta-mono" style={{
                            fontSize: 10, color: "var(--text-mute)",
                            textTransform: "uppercase", letterSpacing: ".08em",
                          }}>
                            {dateStr}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1 }}>
                            {title}
                          </div>
                          <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                            {metaParts.join(" · ")}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          {energy === 5 && (
                            <Badge tone="limeSoft" size="sm"><Icon name="star" size={11} /> Top</Badge>
                          )}
                          {isComplete && <Badge tone="limeSoft" size="sm">Completado</Badge>}
                          {isPartial && <Badge tone="neutral" size="sm">Parcial {s.setsCount}/{s.targetSetsCount}</Badge>}
                        </div>

                        {/* Chevron */}
                        <div style={{
                          width: 20, height: 20, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform .2s",
                          color: "var(--text-mute)",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ id: s.id, title });
                        }}
                        title="Eliminar del historial"
                        style={{
                          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                          background: "transparent", border: "1px solid var(--line-2)",
                          color: "var(--text-mute)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          opacity: isDeleting ? 0.5 : 1,
                        }}
                      >
                        <Icon name="trash" size={14} color="var(--text-mute)" />
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{
                        marginLeft: 52, paddingLeft: 12,
                        borderLeft: "2px solid var(--line)",
                        marginBottom: 8,
                      }}>
                        <SessionDetailInline
                          detail={details[s.id] ?? null}
                          loading={isLoadingThis}
                          onMessages={() => router.push(`/comentarios/${s.id}`)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`¿Eliminar "${confirmDelete.title}" del historial?`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          destructive
          onConfirm={() => {
            const id = confirmDelete.id;
            setConfirmDelete(null);
            deleteSession(id);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {manualOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1400 }}
          onClick={() => setManualOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 540,
              background: "var(--bg-1)", borderRadius: "16px 16px 0 0",
              padding: "18px 16px",
              paddingBottom: "calc(18px + env(safe-area-inset-bottom))",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Cargar actividad</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 10 }}>
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700, textTransform: "uppercase" }}>
                  Inicio
                </div>
                <input
                  type="datetime-local"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  style={{ height: 40, borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)", color: "var(--text)", padding: "0 12px", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 10 }}>
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700, textTransform: "uppercase" }}>
                  Fin
                </div>
                <input
                  type="datetime-local"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  style={{ height: 40, borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)", color: "var(--text)", padding: "0 12px", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12 }}
                />
              </div>

              <div>
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                  Tipo
                </div>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)", color: "var(--text)", padding: "0 12px", outline: "none", fontSize: 14 }}
                >
                  <option value="Deporte">Deporte</option>
                  <option value="Gimnasio">Gimnasio</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                  Actividad
                </div>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Padel, fútbol, etc."
                  style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-1)", color: "var(--text)", padding: "0 12px", outline: "none", fontSize: 14 }}
                />
              </div>

              <div>
                <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", letterSpacing: ".08em", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                  Notas
                </div>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Opcional"
                  rows={3}
                  style={{ width: "100%", background: "transparent", border: "1px solid var(--line-2)", borderRadius: 10, outline: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.5, resize: "none", padding: 10 }}
                />
              </div>

              {manualError && (
                <div style={{ fontSize: 12, color: "var(--danger)" }}>{manualError}</div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={() => setManualOpen(false)}>
                Cancelar
              </Button>
              <Button size="lg" style={{ flex: 2 }} disabled={manualSaving} onClick={saveManual} icon="check">
                {manualSaving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
