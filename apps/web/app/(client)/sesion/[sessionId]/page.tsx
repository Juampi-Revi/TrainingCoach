"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Icon, StateBlock, Tabs } from "@/components/ui";
import type { SessionDetail, SessionExercise, WorkoutSet } from "@regen/types";

type EffortMode = "RPE" | "RIR";

interface SetDraft {
  reps: string;
  kg: string;
  effort: string;
}

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

  const load = useCallback(() => {
    api
      .get<SessionDetail>(`/client/sessions/${sessionId}`)
      .then((s) => {
        setSession(s);
        if (s.status === "completed") router.replace(`/sesion/${sessionId}/completada`);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, sessionId, router]);

  useEffect(() => { load(); }, [load]);

  async function logSet() {
    if (!session) return;
    const ex = session.exercises[currentExIdx];
    if (!ex) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { reps: draft.reps, weight: draft.kg };
      if (effortMode === "RPE") body.rpe = draft.effort;
      else body.rir = draft.effort;

      const nextSetNum = ex.sets.length + 1;
      await api.put(`/client/sessions/${sessionId}/exercises/${ex.id}/sets/${nextSetNum}`, body);
      setLastSaved(new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }));
      setDraft({ reps: "", kg: draft.kg, effort: "" });
      load();
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

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando sesión…" />
      </div>
    );
  }

  const ex: SessionExercise | undefined = session.exercises[currentExIdx];
  const completedExs = session.exercises.filter((e) => {
    const target = e.target?.sets ?? 3;
    return e.sets.length >= target;
  }).length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>
      {/* Top context */}
      <div style={{ padding: "52px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-mute)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              fontWeight: 600,
            }}
          >
            {session.workoutTemplate?.title ?? "Sesión"} · Ej {currentExIdx + 1} de {session.exercises.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}>
            {ex?.exercise.name ?? "—"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastSaved && (
            <span style={{ fontSize: 11, color: "var(--success)" }}>
              Guardado · {lastSaved}
            </span>
          )}
        </div>
      </div>

      {ex && (
        <div className="ta-mono" style={{ padding: "0 20px 4px", fontSize: 11, color: "var(--text-mute)" }}>
          {[
            ex.target?.sets && ex.target?.reps ? `${ex.target.sets} × ${ex.target.reps}` : null,
            ex.target?.intensityTarget ? `@ ${ex.target.intensityType ?? ""} ${ex.target.intensityTarget}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      )}

      {/* Sets log */}
      {ex && (
        <div style={{ padding: "18px 16px 8px" }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 1fr 1fr",
              gap: 6,
              padding: "0 4px 8px",
              fontSize: 10,
              color: "var(--text-mute)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
              fontWeight: 600,
            }}
          >
            <div>Set</div>
            <div style={{ textAlign: "center" }}>Reps</div>
            <div style={{ textAlign: "center" }}>Kg</div>
            <div style={{ textAlign: "center" }}>{effortMode}</div>
          </div>

          {/* Completed sets */}
          {ex.sets.map((s: WorkoutSet) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 1fr 1fr",
                gap: 6,
                alignItems: "center",
                padding: "8px 4px",
                borderRadius: 10,
                marginBottom: 4,
              }}
            >
              <div
                className="ta-mono"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--success)",
                  color: "#0B0B0C",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Icon name="check" size={12} />
              </div>
              {[s.reps ?? "—", s.weight ?? "—", (effortMode === "RPE" ? s.rpe : s.rir) ?? "—"].map((v, i) => (
                <div
                  key={i}
                  className="ta-mono"
                  style={{ textAlign: "center", fontSize: 17, fontWeight: 600 }}
                >
                  {v}
                </div>
              ))}
            </div>
          ))}

          {/* Active set entry row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 1fr 1fr",
              gap: 6,
              alignItems: "center",
              padding: "8px 4px",
              background: "var(--bg-1)",
              border: "1px solid var(--lime)",
              borderRadius: 10,
              marginBottom: 4,
            }}
          >
            <div
              className="ta-mono"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-2)",
                color: "var(--text-mute)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {ex.sets.length + 1}
            </div>
            {(["reps", "kg", "effort"] as const).map((field) => (
              <input
                key={field}
                type="number"
                inputMode="decimal"
                value={draft[field]}
                onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                placeholder="—"
                style={{
                  textAlign: "center",
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 8,
                  padding: "8px 0",
                  fontSize: 17,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  width: "100%",
                  outline: "none",
                }}
              />
            ))}
          </div>

          {/* Effort toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
              }}
            >
              Esfuerzo
            </span>
            <Tabs
              variant="pills"
              tabs={["RPE", "RIR"]}
              active={effortMode}
              onChange={(t) => setEffortMode(t as EffortMode)}
            />
          </div>
        </div>
      )}

      {/* Exercise navigation */}
      <div style={{ display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto" }}>
        {session.exercises.map((e, i) => {
          const target = e.target?.sets ?? 3;
          const done = e.sets.length >= target;
          return (
            <button
              key={e.id}
              onClick={() => { setCurrentExIdx(i); setDraft({ reps: "", kg: "", effort: "" }); }}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${i === currentExIdx ? "var(--lime)" : done ? "var(--success)" : "var(--line-2)"}`,
                background: i === currentExIdx ? "var(--bg-1)" : "transparent",
                color: i === currentExIdx ? "var(--text)" : done ? "var(--success)" : "var(--text-mute)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          );
        })}
      </div>

      {/* Bottom CTAs */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 16px 28px",
          background: "linear-gradient(to top, var(--bg) 70%, transparent)",
          display: "flex",
          gap: 8,
        }}
      >
        {completedExs === session.exercises.length ? (
          <Button
            size="xl"
            block
            icon="check"
            style={{ fontSize: 16 }}
            disabled={completing}
            onClick={completeSession}
          >
            {completing ? "Completando…" : "Finalizar sesión"}
          </Button>
        ) : (
          <>
            {currentExIdx < session.exercises.length - 1 && (
              <Button
                size="xl"
                variant="secondary"
                style={{ width: 64 }}
                onClick={() => { setCurrentExIdx(i => i + 1); setDraft({ reps: "", kg: "", effort: "" }); }}
                icon="chevR"
              />
            )}
            <Button
              size="xl"
              icon="check"
              style={{ flex: 1, fontSize: 16 }}
              disabled={saving || !draft.reps}
              onClick={logSet}
            >
              {saving ? "Guardando…" : "Completar set"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
