"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Icon, StateBlock, Tabs } from "@/components/ui";
import type { SessionSummary } from "@regen/types";

type Filter = "Mes" | "Todo";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistorialPage() {
  const { api } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Mes");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

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
      const sessionNotes =
        title && notes ? `Actividad: ${title}\n${notes}` : title ? `Actividad: ${title}` : notes ? notes : null;

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

  const totalVol = filtered.reduce((acc, s) => acc + s.totalVolumeKg, 0);

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

      {/* Summary card */}
      {filtered.length > 0 && (
        <div style={{ padding: "0 20px 12px" }}>
          <div
            style={{
              padding: 14,
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontWeight: 600,
                  }}
                >
                  Volumen total · kg
                </div>
                <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>
                  {Math.round(totalVol).toLocaleString("es")}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-mute)" }}>
                {filter === "Mes" ? "30 días" : "Total"}
              </span>
            </div>
            {/* Simple bar chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 54 }}>
              {filtered.slice(-8).map((s, i) => {
                const max = Math.max(...filtered.slice(-8).map((x) => x.totalVolumeKg), 1);
                const h = (s.totalVolumeKg / max) * 100;
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: i === filtered.slice(-8).length - 1 ? "var(--lime)" : "var(--bg-3)",
                      borderRadius: 3,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            return (
              <Link
                key={s.id}
                href={`/comentarios/${s.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "14px 0",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none",
                    alignItems: "center",
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
                      {s.workoutTemplate?.title ?? "Sesión libre"}
                    </div>
                    <div
                      className="ta-mono"
                      style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}
                    >
                      {s.setsCount} series · {Math.round(s.totalVolumeKg).toLocaleString("es")}kg
                      {s.energyRating ? ` · Energía ${s.energyRating}/10` : ""}
                    </div>
                  </div>
                  {s.energyRating && s.energyRating >= 9 && (
                    <Badge tone="limeSoft" size="sm">
                      <Icon name="star" size={11} /> Top
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
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
