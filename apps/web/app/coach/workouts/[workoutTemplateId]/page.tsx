"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Icon, Input, StateBlock, Tabs } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { WorkoutTemplateDetail } from "@regen/types";

type IntensityLabel = "Baja" | "Media" | "Alta";
const INTENSITY_VALS: IntensityLabel[] = ["Baja", "Media", "Alta"];

export default function TemplateEditorPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const { workoutTemplateId } = useParams<{ workoutTemplateId: string }>();
  const [data, setData] = useState<WorkoutTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [warmup, setWarmup] = useState("");
  const [intensity, setIntensity] = useState<IntensityLabel>("Media");

  useEffect(() => {
    api
      .get<WorkoutTemplateDetail>(`/coach/workouts/${workoutTemplateId}`)
      .then((d) => {
        setData(d);
        setTitle(d.title);
        setDescription(d.description ?? "");
        setWarmup(d.warmupNotes ?? "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, workoutTemplateId]);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/coach/workouts/${workoutTemplateId}`, {
        title,
        description,
        warmupNotes: warmup || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DesktopShell active="templates" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="loading" title="Cargando template…" />
      </DesktopShell>
    );
  }

  if (!data) {
    return (
      <DesktopShell active="templates" coachName={user?.name ?? "Coach"}>
        <StateBlock kind="error" title="Template no encontrado" />
      </DesktopShell>
    );
  }

  return (
    <DesktopShell
      active="templates"
      title={
        <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
          Templates <span style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "var(--text)", fontWeight: 700 }}>{data.title}</span>
        </span>
      }
      subtitle={`Template · ${saved ? "guardado ✓" : "editando"}`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/coach/workouts")}
          >
            Descartar
          </Button>
          <Button size="sm" icon="check" disabled={saving} onClick={save}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          height: "calc(100vh - 74px)",
        }}
      >
        {/* Main editor */}
        <div style={{ padding: 28, overflow: "auto" }}>
          {/* Title block */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {data.tags.map((tag) => (
                <Badge key={tag} tone="lime">
                  {tag}
                </Badge>
              ))}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-.02em",
              }}
            >
              {data.title}
            </div>
            {data.description && (
              <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
                {data.description}
              </div>
            )}
          </div>

          {/* Warmup */}
          {data.warmupNotes && (
            <div
              style={{
                padding: 14,
                background: "var(--bg-1)",
                borderRadius: 12,
                border: "1px solid var(--line)",
                borderLeft: "3px solid var(--lime)",
                marginBottom: 20,
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

          {/* Exercises table */}
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
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "28px 2.2fr 60px 90px 90px 80px 1fr 32px",
                padding: "10px 14px",
                background: "var(--bg-2)",
                borderBottom: "1px solid var(--line)",
                fontSize: 10,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontWeight: 600,
                gap: 8,
              }}
            >
              <div>#</div>
              <div>Ejercicio</div>
              <div style={{ textAlign: "center" }}>Sets</div>
              <div style={{ textAlign: "center" }}>Reps</div>
              <div style={{ textAlign: "center" }}>Esfuerzo</div>
              <div style={{ textAlign: "center" }}>Rest</div>
              <div>Nota</div>
              <div />
            </div>

            {data.exercises.map((ex, i) => (
              <div
                key={ex.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 2.2fr 60px 90px 90px 80px 1fr 32px",
                  padding: "10px 14px",
                  borderBottom:
                    i < data.exercises.length - 1 ? "1px solid var(--line)" : "none",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Icon name="more" size={12} color="var(--text-dim)" />
                </div>
                <div style={{ fontWeight: 500 }}>{ex.exercise.name}</div>
                <div className="ta-mono" style={{ textAlign: "center" }}>
                  {ex.targetSets ?? "—"}
                </div>
                <div className="ta-mono" style={{ textAlign: "center" }}>
                  {ex.targetReps ?? "—"}
                </div>
                <div
                  className="ta-mono"
                  style={{ textAlign: "center", color: "var(--text-mute)" }}
                >
                  {ex.intensityTarget
                    ? `${ex.intensityType ?? ""} ${ex.intensityTarget}`.trim()
                    : "—"}
                </div>
                <div
                  className="ta-mono"
                  style={{ textAlign: "center", color: "var(--text-mute)" }}
                >
                  {ex.restSeconds ? `${ex.restSeconds}s` : "—"}
                </div>
                <div
                  className="ta-ellipsis"
                  style={{
                    fontSize: 11,
                    color: ex.notes ? "var(--lime)" : "var(--text-dim)",
                  }}
                >
                  {ex.notes || "—"}
                </div>
                <Icon name="trash" size={13} color="var(--text-dim)" />
              </div>
            ))}

            {data.exercises.length === 0 && (
              <div style={{ padding: "20px 14px", color: "var(--text-mute)", fontSize: 13 }}>
                Sin ejercicios. Añadí el primero.
              </div>
            )}

            <div
              style={{
                padding: 10,
                borderTop: "1px solid var(--line)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button variant="ghost" size="sm" icon="plus">
                Añadir ejercicio
              </Button>
            </div>
          </div>
        </div>

        {/* Right inspector */}
        <div
          style={{
            background: "var(--bg-1)",
            borderLeft: "1px solid var(--line)",
            padding: 20,
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-mute)",
              textTransform: "uppercase",
              letterSpacing: ".1em",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Propiedades
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Nombre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Músculo · grupo muscular"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-mute)",
                  fontWeight: 500,
                  letterSpacing: ".02em",
                  textTransform: "uppercase",
                }}
              >
                Intensidad
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {INTENSITY_VALS.map((v, i) => (
                  <button
                    key={v}
                    onClick={() => setIntensity(v)}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      background: intensity === v ? "var(--lime)" : "var(--bg-2)",
                      color: intensity === v ? "#0B0B0C" : "var(--text-mute)",
                      border: `1px solid ${intensity === v ? "var(--lime)" : "var(--line-2)"}`,
                      cursor: "pointer",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-mute)",
                  fontWeight: 500,
                  letterSpacing: ".02em",
                  textTransform: "uppercase",
                }}
              >
                Warm-up
              </span>
              <textarea
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
                placeholder="Instrucciones de calentamiento…"
                rows={4}
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.5,
                  resize: "vertical",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}
