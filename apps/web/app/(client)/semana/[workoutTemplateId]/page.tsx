"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, Icon, StateBlock } from "@/components/ui";
import type { ClientWeekResponse, WorkoutTemplateDetail } from "@regen/types";
import { ApiError } from "@/lib/api";
import { WorkoutBlockPreviewCard } from "@/components/features/training/workout-block-preview-card";
import { estimateWorkoutDurationSeconds, formatBlockDurationShort } from "@/lib/training-blocks";

export default function WorkoutDetailPage() {
  const { api } = useAuth();
  const router = useRouter();
  const { workoutTemplateId } = useParams<{ workoutTemplateId: string }>();
  const searchParams = useSearchParams();
  const pwwId = searchParams.get("pwwId");
  const [data, setData] = useState<WorkoutTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressionNote, setProgressionNote] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<WorkoutTemplateDetail>(`/client/workouts/${workoutTemplateId}`)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, workoutTemplateId]);

  useEffect(() => {
    if (!pwwId) return;
    api
      .get<ClientWeekResponse>("/client/week")
      .then((week) => {
        const w = week.workouts.find((x) => x.pwwId === pwwId) ?? null;
        setProgressionNote(w?.progressionNote ?? null);
      })
      .catch(() => setProgressionNote(null));
  }, [api, pwwId]);

  async function startSession() {
    if (!data) return;
    setStarting(true);
    try {
      const res = await api.post<{ id: string }>("/client/sessions", { workoutTemplateId: data.id, planWeekWorkoutId: pwwId });
      router.push(`/sesion/${res.id}`);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al iniciar sesión";
      setError(msg);
      setStarting(false);
    }
  }

  if (loading) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="loading" title="Cargando…" /></div>;
  }

  if (error || !data) {
    return <div style={{ minHeight: "100dvh", background: "var(--bg)" }}><StateBlock kind="error" title="No se pudo cargar" body={error ?? ""} /></div>;
  }

  const blocksSorted = [...(data.blocks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalExercises = data.exercises?.length ?? 0;
  const totalEstimated = formatBlockDurationShort(estimateWorkoutDurationSeconds(blocksSorted));
  const extraBlockCount = blocksSorted.filter((block) => block.isExtra).length;
  const extraGroupCount = Array.from(
    new Set(
      data.exercises
        .filter((exercise) => exercise.supersetGroup && exercise.groupIsExtra)
        .map((exercise) => `${exercise.workoutBlockId}:${exercise.supersetGroup}`),
    ),
  ).length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", paddingBottom: "calc(120px + 84px + env(safe-area-inset-bottom))" }}>

      {/* Gradient header */}
      <div style={{
        position: "relative",
        background: "linear-gradient(180deg, #1c1c20 0%, var(--bg) 100%)",
        padding: "52px 18px 16px",
        borderBottom: "1px solid var(--line)",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(11,11,12,.5)", border: "1px solid var(--line-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text)", cursor: "pointer",
            position: "absolute", top: 42, left: 14,
          }}
        >
          <Icon name="chevL" size={18} />
        </button>

        <div style={{ marginTop: 28 }}>
          {data.tags.length > 0 && (
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--accent-text)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 4 }}>
              {data.tags[0].toUpperCase()}
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.1 }}>
            {data.title}
          </div>
          {data.description && (
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>{data.description}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11, color: "var(--text-mute)" }}>
          <span>{totalExercises} ejercicios</span>
          <span>·</span>
          <span>{blocksSorted.length} bloques</span>
          {totalEstimated !== "—" && <><span>·</span><span>{totalEstimated} estimados</span></>}
        </div>
      </div>

      <div style={{ padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {(extraBlockCount > 0 || extraGroupCount > 0) && (
          <div
            style={{
              background: "rgba(215,255,58,.06)",
              border: "1px solid rgba(215,255,58,.22)",
              borderLeft: "3px solid var(--lime)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="plus" size={14} color="var(--lime)" />
              <span className="ta-mono" style={{ fontSize: 9, color: "var(--lime)", letterSpacing: ".1em", fontWeight: 700 }}>
                EXTRAS OPCIONALES
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.35 }}>
              {extraBlockCount > 0 ? `${extraBlockCount} bloque${extraBlockCount > 1 ? "s" : ""}` : null}
              {extraBlockCount > 0 && extraGroupCount > 0 ? " · " : null}
              {extraGroupCount > 0 ? `${extraGroupCount} grupo${extraGroupCount > 1 ? "s" : ""}` : null}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4, lineHeight: 1.45 }}>
              Se ven desde el inicio y no cuentan para completar el entrenamiento.
            </div>
          </div>
        )}
        {progressionNote && (
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderLeft: "3px solid var(--lime)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="info" size={14} color="var(--lime)" />
              <span className="ta-mono" style={{ fontSize: 9, color: "var(--lime)", letterSpacing: ".1em", fontWeight: 700 }}>
                PROGRESIÓN
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, lineHeight: 1.35 }}>
              {progressionNote}
            </div>
          </div>
        )}

        {blocksSorted.map((block) => (
          <WorkoutBlockPreviewCard
            key={block.id}
            block={block}
            exercises={data.exercises.filter((exercise) => exercise.workoutBlockId === block.id)}
          />
        ))}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: "calc(84px + env(safe-area-inset-bottom))",
        padding: "14px 20px 14px",
        background: "linear-gradient(to top, var(--bg) 70%, transparent)",
      }}>
        {error && (
          <div style={{ fontSize: 12, color: "var(--danger)", textAlign: "center", marginBottom: 8 }}>{error}</div>
        )}
        <Button size="xl" block icon="play" style={{ fontSize: 17 }} disabled={starting} onClick={startSession}>
          {starting ? "Iniciando…" : "Empezar entrenamiento"}
        </Button>
      </div>
    </div>
  );
}
