"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Icon, StateBlock } from "@/components/ui";
import type { WorkoutTemplateDetail } from "@regen/types";
import { ApiError } from "@/lib/api";

export default function WorkoutDetailPage() {
  const { api } = useAuth();
  const router = useRouter();
  const { workoutTemplateId } = useParams<{ workoutTemplateId: string }>();
  const [data, setData] = useState<WorkoutTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<WorkoutTemplateDetail>(`/client/workouts/${workoutTemplateId}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, workoutTemplateId]);

  async function startSession() {
    if (!data) return;
    setStarting(true);
    try {
      const res = await api.post<{ id: string }>("/client/sessions", {
        workoutTemplateId: data.id,
      });
      router.push(`/sesion/${res.id}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al iniciar sesión";
      setError(msg);
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="loading" title="Cargando…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
        <StateBlock kind="error" title="No se pudo cargar" body={error ?? ""} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: 120 }}>
      {/* Nav bar */}
      <div
        style={{
          padding: "44px 16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => router.back()}
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
      </div>

      <div style={{ padding: "8px 20px 16px" }}>
        {data.tags.length > 0 && (
          <Badge tone="limeSoft" style={{ marginBottom: 10 }}>
            {data.tags[0]}
          </Badge>
        )}
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-.03em",
            marginTop: data.tags.length ? 10 : 0,
            lineHeight: 1.05,
          }}
        >
          {data.title}
        </div>
        {data.description && (
          <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
            {data.description}
          </div>
        )}
        <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "var(--text-mute)",
            }}
          >
            <Icon name="dumbbell" size={14} />
            {data.exercises.length} ejercicios
          </div>
        </div>
      </div>

      {/* Warmup */}
      {data.warmupNotes && (
        <div
          style={{
            margin: "0 20px 16px",
            padding: 14,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            borderLeft: "3px solid var(--lime)",
          }}
        >
          <div
            className="ta-mono"
            style={{
              fontSize: 10,
              color: "var(--lime)",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Warm-up
          </div>
          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>
            {data.warmupNotes}
          </div>
        </div>
      )}

      {/* Exercises */}
      <div style={{ padding: "0 20px" }}>
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
          Ejercicios · {data.exercises.length}
        </div>
        {data.exercises.map((ex, i) => (
          <div
            key={ex.id}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < data.exercises.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <div
              className="ta-mono"
              style={{
                fontSize: 13,
                color: "var(--text-dim)",
                width: 22,
                fontWeight: 500,
                paddingTop: 2,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
                {ex.exercise.name}
              </div>
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
                {[
                  ex.targetSets && ex.targetReps ? `${ex.targetSets} × ${ex.targetReps}` : null,
                  ex.intensityTarget ? `@ ${ex.intensityType ?? ""} ${ex.intensityTarget}` : null,
                  ex.restSeconds ? `descanso ${ex.restSeconds}s` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {ex.notes && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--lime)",
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="alert" size={11} />
                  {ex.notes}
                </div>
              )}
            </div>
            {ex.exercise.primaryMuscle && (
              <Badge tone="neutral" size="sm">
                {ex.exercise.primaryMuscle}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 20px 28px",
          background: "linear-gradient(to top, var(--bg) 70%, transparent)",
        }}
      >
        <Button
          size="xl"
          block
          icon="play"
          style={{ fontSize: 17 }}
          disabled={starting}
          onClick={startSession}
        >
          {starting ? "Iniciando…" : "Iniciar sesión"}
        </Button>
      </div>
    </div>
  );
}
