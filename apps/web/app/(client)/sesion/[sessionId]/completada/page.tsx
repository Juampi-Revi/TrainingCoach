"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Icon, StateBlock } from "@/components/ui";
import type { SessionDetail } from "@regen/types";

const ENERGY_LABELS: Record<number, string> = { 1: "BAJA", 3: "MEDIA", 5: "ALTA" };

export default function SessionCompletadaPage() {
  const { api } = useAuth();
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [energy, setEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<SessionDetail>(`/client/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        // Map legacy 1-10 values to 1-5 range
        setEnergy(s.energyRating != null ? Math.ceil(s.energyRating / 2) : null);
        setNotes(s.sessionNotes ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, sessionId]);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/client/sessions/${sessionId}`, {
        energyRating: energy,
        sessionNotes: notes || null,
      });
      router.replace("/semana");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  if (loading || !session) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="loading" title="Cargando…" /></div>;
  }

  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const targetSets = session.exercises.reduce((acc, e) => acc + (e.target?.sets ?? 0), 0);
  const totalVol = session.exercises.reduce((acc, e) => {
    return acc + e.sets.reduce((a, s) => a + (Number(s.reps ?? 0) * Number(s.weight ?? 0)), 0);
  }, 0);

  const perfAt = new Date(session.performedAt);
  const timeStr = perfAt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const dateStr = perfAt.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" });

  const durationMin = session.completedAt
    ? Math.round((new Date(session.completedAt).getTime() - perfAt.getTime()) / 60000)
    : null;
  const durationStr = durationMin != null
    ? durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}min` : `${durationMin}min`
    : null;

  // Find top sets for highlights (heaviest weight per exercise)
  const highlights = session.exercises
    .map((e) => {
      const best = e.sets.reduce<{ weight: number; reps: number } | null>((acc, s) => {
        const w = Number(s.weight ?? 0);
        const r = Number(s.reps ?? 0);
        if (!acc || w > acc.weight || (w === acc.weight && r > acc.reps)) return { weight: w, reps: r };
        return acc;
      }, null);
      return best && best.weight > 0 ? { name: e.exercise.name, weight: best.weight, reps: best.reps } : null;
    })
    .filter((h): h is { name: string; weight: number; reps: number } => h !== null)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* Hero */}
      <div style={{
        padding: "60px 18px 20px",
        background: "linear-gradient(180deg, rgba(215,255,58,.12) 0%, var(--bg) 100%)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--lime)", letterSpacing: ".15em", fontWeight: 700 }}>
          SESIÓN COMPLETADA
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginTop: 4, lineHeight: 1.1 }}>
          {session.workoutTemplate?.title ?? "Sesión"}
        </div>
        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4, textTransform: "uppercase" }}>
          {dateStr} · {timeStr}{durationStr ? ` · ${durationStr}` : ""}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
          <StatCard label="VOLUMEN" value={Math.round(totalVol).toLocaleString("es")} unit="kg" />
          <StatCard label="SERIES" value={`${totalSets}${targetSets > 0 ? `/${targetSets}` : ""}`} />
          <StatCard label="EJERCICIOS" value={String(session.exercises.length)} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>

        {/* Energy rating 1-5 */}
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>¿CÓMO TE SENTISTE?</div>
          <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4, marginBottom: 10 }}>Energía durante el entrenamiento</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const sel = energy === n;
              return (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  style={{
                    flex: 1, height: 56, borderRadius: 9,
                    background: sel ? "var(--lime)" : "var(--bg-2)",
                    border: `1px solid ${sel ? "var(--lime)" : "var(--line-2)"}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    cursor: "pointer", color: sel ? "#0B0B0C" : "var(--text-mute)",
                  }}
                >
                  <span className="ta-mono" style={{ fontSize: 16, fontWeight: 700 }}>{n}</span>
                  {ENERGY_LABELS[n] && (
                    <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: ".05em" }}>{ENERGY_LABELS[n]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>DESTACADOS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {highlights.map((h, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{h.name}</div>
                    <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>
                      {h.weight} kg × {h.reps} reps
                    </div>
                  </div>
                  <div style={{
                    padding: "3px 8px", borderRadius: 5,
                    background: "rgba(215,255,58,.12)", border: "1px solid rgba(215,255,58,.25)",
                    fontSize: 10, fontWeight: 700, color: "var(--lime)", fontFamily: "var(--font-mono)",
                  }}>
                    TOP
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
          <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 8 }}>NOTA PARA EL COACH</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Cómo estuvo la sesión? ¿Alguna molestia?"
            rows={3}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)", lineHeight: 1.5, resize: "none",
            }}
          />
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: "10px 16px 28px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, background: "var(--bg)" }}>
        <Button
          size="lg" variant="secondary" icon="msg" style={{ flex: 1 }}
          onClick={() => router.push(`/comentarios/${sessionId}`)}
        >
          Comentarios
        </Button>
        <Button size="lg" style={{ flex: 1.4 }} disabled={saving} onClick={save}>
          {saving ? "Guardando…" : "Confirmar"}
          {!saving && <Icon name="check" size={14} color="#0B0B0C" />}
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div style={{
      background: "var(--bg-1)",
      border: `1px solid ${accent ? "var(--lime)" : "var(--line)"}`,
      borderRadius: 10, padding: "10px 8px",
    }}>
      <div className="ta-mono" style={{ fontSize: 8, color: accent ? "var(--lime)" : "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 4 }}>
        <span className="ta-mono" style={{ fontSize: 20, fontWeight: 700, color: accent ? "var(--lime)" : "var(--text)", letterSpacing: "-.02em" }}>{value}</span>
        {unit && <span className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>{unit}</span>}
      </div>
    </div>
  );
}
