"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Card, Icon, StateBlock } from "@/components/ui";
import type { SessionDetail } from "@regen/types";

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
        setEnergy(s.energyRating);
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
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando…" />
      </div>
    );
  }

  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const totalVol = session.exercises.reduce((acc, e) => {
    return acc + e.sets.reduce((a, s) => a + (Number(s.reps ?? 0) * Number(s.weight ?? 0)), 0);
  }, 0);

  const perfAt = new Date(session.performedAt);
  const dateStr = perfAt.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 40 }}>
      <div style={{ padding: "52px 20px 8px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--lime)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon name="check" size={30} color="#0B0B0C" />
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--lime)",
            textTransform: "uppercase",
            letterSpacing: ".1em",
            fontWeight: 700,
          }}
        >
          Sesión completa
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", marginTop: 6 }}>
          {session.workoutTemplate?.title ?? "Sesión"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>{dateStr}</div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Card pad={12}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              Volumen
            </div>
            <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
              {Math.round(totalVol).toLocaleString("es")}
              <span style={{ fontSize: 11, color: "var(--text-mute)", marginLeft: 4 }}>kg</span>
            </div>
          </Card>
          <Card pad={12}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              Sets
            </div>
            <div className="ta-mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
              {totalSets}
              <span style={{ fontSize: 11, color: "var(--text-mute)", marginLeft: 4 }}>
                · {session.exercises.length} ej
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Energy rating */}
      <div style={{ padding: "20px 20px 12px" }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-mute)",
            textTransform: "uppercase",
            letterSpacing: ".1em",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Energía · ¿cómo te fue?
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setEnergy(i + 1)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 7,
                background: energy !== null && i < energy ? "var(--lime)" : "var(--bg-2)",
                border: `1px solid ${energy !== null && i < energy ? "var(--lime)" : "var(--line-2)"}`,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: energy !== null && i < energy ? "#0B0B0C" : "var(--text-dim)",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ padding: "4px 20px 0" }}>
        <div
          style={{
            padding: 12,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-mute)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Nota para el coach
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Cómo estuvo la sesión? ¿Alguna molestia?"
            rows={3}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--text)",
              lineHeight: 1.5,
              resize: "none",
            }}
          />
        </div>
      </div>

      <div style={{ padding: "18px 20px 4px", display: "flex", gap: 8 }}>
        <Button
          size="lg"
          variant="secondary"
          icon="msg"
          style={{ flex: 1 }}
          onClick={() => router.push(`/comentarios/${sessionId}`)}
        >
          Comentarios
        </Button>
        <Button size="lg" style={{ flex: 1 }} disabled={saving} onClick={save}>
          {saving ? "Guardando…" : "Listo"}
        </Button>
      </div>
    </div>
  );
}
