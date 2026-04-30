"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Badge, Button, ConfirmModal, Icon, StateBlock, Tabs } from "@/components/ui";
import type { SessionSummary } from "@regen/types";

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
    if (low.startsWith("actividad:")) {
      title = line.slice("actividad:".length).trim() || null;
      continue;
    }
    if (low.startsWith("tipo:")) {
      type = line.slice("tipo:".length).trim() || null;
      continue;
    }
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

export default function HistorialPage() {
  const { api } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Mes");
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

  const load = useCallback(() => {
    api
      .get<{ items: SessionSummary[]; nextCursor: string | null }>("/client/sessions?limit=50")
      .then((r) => setSessions(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

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

  const completed = sessions.filter((s) => s.status === "completed");
  const filtered =
    filter === "Mes"
      ? completed.filter((s) => {
          const d = new Date(s.performedAt);
          const now = new Date();
          const diff = (now.getTime() - d.getTime()) / 86400000;
          return diff <= 30;
        })
      : completed;

  const deleteSession = async (sessionId: string) => {
    if (deletingId) return;
    setDeletingId(sessionId);
    try {
      await api.patch(`/client/sessions/${sessionId}`, { status: "discarded" });
      setSessions((prev) => prev.filter((x) => x.id !== sessionId));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
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
        <StateBlock kind="empty" title="Sin sesiones" body="Completá tu primera sesión para verla acá." />
      ) : (
        <div style={{ padding: "0 20px" }}>
          {filtered.map((s, i) => {
            const d = new Date(s.performedAt);
            const dateStr = d.toLocaleDateString("es", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const manualMeta = parseManualMeta(s.sessionNotes);
            const title = s.workoutTemplate?.title ?? manualMeta.title ?? "Sesión libre";
            const isDeleting = deletingId === s.id;
            const durationMinutes =
              s.completedAt
                ? (() => {
                    const ms = new Date(s.completedAt).getTime() - new Date(s.performedAt).getTime();
                    return Number.isFinite(ms) && ms >= 0 ? ms / 60000 : null;
                  })()
                : null;
            const durationStr = durationMinutes != null ? fmtMinutes(durationMinutes) : null;
            const isManual = !s.workoutTemplate && (manualMeta.title || manualMeta.type);
            const energy = normalizeEnergyRating(s.energyRating);
            const isComplete = s.targetSetsCount > 0 && s.setsCount >= s.targetSetsCount;
            const isPartial = s.targetSetsCount > 0 && s.setsCount < s.targetSetsCount;
            const metaParts: string[] = [];
            if (isManual) {
              if (manualMeta.type) metaParts.push(manualMeta.type);
            } else {
              metaParts.push(`${s.setsCount}${s.targetSetsCount > 0 ? `/${s.targetSetsCount}` : ""} series`);
            }
            if (durationStr) metaParts.push(durationStr);
            if (energy) metaParts.push(`Energía ${energy}/5`);

            return (
              <div
                key={s.id}
                onClick={() => router.push(`/comentarios/${s.id}`)}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "14px 0",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: i === 0 ? "var(--lime)" : "var(--bg-2)",
                    border: `1px solid ${i === 0 ? "var(--lime)" : "var(--line)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: i === 0 ? "#0B0B0C" : "var(--lime)",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="check" size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="ta-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--text-mute)",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    {dateStr}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 1 }}>
                    {title}
                  </div>
                  <div
                    className="ta-mono"
                    style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}
                  >
                    {metaParts.join(" · ")}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  {energy === 5 && (
                    <Badge tone="limeSoft" size="sm">
                      <Icon name="star" size={11} /> Top
                    </Badge>
                  )}
                  {isComplete && (
                    <Badge tone="limeSoft" size="sm">Completado</Badge>
                  )}
                  {isPartial && (
                    <Badge tone="neutral" size="sm">Parcial {s.setsCount}/{s.targetSetsCount}</Badge>
                  )}
                </div>

                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    disabled={isDeleting}
                    onClick={() => setConfirmDelete({ id: s.id, title })}
                    title="Eliminar del historial"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "transparent",
                      border: "1px solid var(--line-2)",
                      color: "var(--text-mute)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    <Icon name="trash" size={14} color="var(--text-mute)" />
                  </button>
                </div>
              </div>
            );
          })}
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
              width: "100%",
              maxWidth: 540,
              background: "var(--bg-1)",
              borderRadius: "16px 16px 0 0",
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
                  style={{
                    width: "100%",
                    height: 42,
                    borderRadius: 10,
                    border: "1px solid var(--line-2)",
                    background: "var(--bg-1)",
                    color: "var(--text)",
                    padding: "0 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
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
                <div style={{ fontSize: 12, color: "var(--danger)" }}>
                  {manualError}
                </div>
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
  );
}
