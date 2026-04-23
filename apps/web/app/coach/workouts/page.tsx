"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Badge, Button, Icon, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { WorkoutTemplateSummary } from "@regen/types";

const TAG_COLORS: Record<string, string> = {
  push: "lime",
  pull: "info",
  legs: "warn",
  upper: "neutral",
  full: "neutral",
  lower: "warn",
};

export default function WorkoutsPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkoutTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .get<WorkoutTemplateSummary[]>("/coach/workouts")
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  async function createTemplate() {
    setCreating(true);
    try {
      const t = await api.post<{ id: string }>("/coach/workouts", {
        title: "Nuevo template",
        description: "",
      });
      router.push(`/coach/workouts/${t.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  }

  return (
    <DesktopShell
      active="templates"
      title="Templates"
      subtitle={`${templates.length} templates`}
      coachName={user?.name ?? "Coach"}
      actions={
        <Button size="sm" icon="plus" disabled={creating} onClick={createTemplate}>
          {creating ? "Creando…" : "Nuevo template"}
        </Button>
      }
    >
      <div style={{ padding: 28 }}>
        {loading ? (
          <StateBlock kind="loading" title="Cargando templates…" />
        ) : templates.length === 0 ? (
          <StateBlock
            kind="empty"
            title="Sin templates"
            body="Creá tu primer workout template."
            cta={
              <Button size="sm" icon="plus" onClick={createTemplate}>
                Crear template
              </Button>
            }
          />
        ) : (
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
                gridTemplateColumns: "2.5fr 1.5fr 80px 120px 32px",
                padding: "10px 16px",
                background: "var(--bg-2)",
                borderBottom: "1px solid var(--line)",
                gap: 12,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-mute)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              <div>Nombre</div>
              <div>Etiquetas</div>
              <div style={{ textAlign: "center" }}>Ejercicios</div>
              <div>Actualizado</div>
              <div />
            </div>

            {templates.map((t, i) => {
              const tagKey = t.tags[0]?.toLowerCase() ?? "";
              const tone = (TAG_COLORS[tagKey] ?? "neutral") as
                | "lime"
                | "neutral"
                | "info"
                | "warn";
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/coach/workouts/${t.id}`)}
                  className="ta-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.5fr 1.5fr 80px 120px 32px",
                    padding: "12px 16px",
                    borderBottom:
                      i < templates.length - 1 ? "1px solid var(--line)" : "none",
                    gap: 12,
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {t.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} tone={tone} size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div
                    className="ta-mono"
                    style={{ textAlign: "center", fontSize: 13 }}
                  >
                    {t.exerciseCount}
                  </div>
                  <div
                    className="ta-mono"
                    style={{ fontSize: 11, color: "var(--text-mute)" }}
                  >
                    {new Date(t.updatedAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <Icon name="chevR" size={14} color="var(--text-mute)" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
