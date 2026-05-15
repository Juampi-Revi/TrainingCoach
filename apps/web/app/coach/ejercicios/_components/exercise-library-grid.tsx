"use client";

import Image from "next/image";
import { Badge, Button, Icon, StateBlock } from "@/components/ui";
import { EXERCISE_DIFFICULTY_LABEL, EXERCISE_OBJECTIVE_LABEL, MUSCLE_LABEL } from "@/lib/constants";
import type { ExerciseLibraryItem } from "../_hooks/use-exercise-library";

export function ExerciseLibraryGrid({
  items,
  addContext,
  onEdit,
  onToggleFavorite,
  onAddToWorkout,
}: {
  items: ExerciseLibraryItem[] | null;
  addContext: { templateId: string; blockId: string } | null;
  onEdit: (ex: ExerciseLibraryItem) => void;
  onToggleFavorite: (exerciseId: string, next: boolean) => void;
  onAddToWorkout: (exerciseId: string) => void;
}) {
  if (items === null) {
    return <StateBlock kind="loading" title="Cargando ejercicios…" />;
  }

  if (items.length === 0) {
    return <StateBlock kind="empty" title="Sin resultados" body="Probá con otro término de búsqueda." />;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
      {items.map((ex) => (
        <div
          key={ex.id}
          onClick={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest("[data-stop-card-click='true']")) return;
            if (!ex.isSystem) onEdit(ex);
          }}
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
            cursor: ex.isSystem ? "default" : "pointer",
            position: "relative",
          }}
          className={ex.isSystem ? undefined : "ta-row"}
        >
          <button
            data-stop-card-click="true"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(ex.id, !ex.isFavorite);
            }}
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              width: 28,
              height: 28,
              borderRadius: 9,
              border: "1px solid var(--line-2)",
              background: ex.isFavorite ? "rgba(215,255,58,.18)" : "rgba(0,0,0,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 2,
            }}
            aria-label={ex.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Icon name="star" size={14} color={ex.isFavorite ? "var(--lime)" : "var(--text)"} />
          </button>

          <div style={{ height: 100, background: "var(--bg-2)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {ex.thumbnailUrl ? (
              <Image
                unoptimized
                src={ex.thumbnailUrl}
                alt={ex.name}
                fill
                sizes="(max-width: 600px) 100vw, 220px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <Icon name="dumbbell" size={28} color="var(--text-dim)" />
            )}
          </div>

          {!ex.isSystem && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "rgba(0,0,0,.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="edit" size={12} color="var(--text)" />
            </div>
          )}

          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{ex.name}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {ex.primaryMuscle && <Badge tone="neutral" size="sm">{MUSCLE_LABEL[ex.primaryMuscle] ?? ex.primaryMuscle}</Badge>}
              {ex.equipment && <Badge tone="neutral" size="sm">{ex.equipment}</Badge>}
              {ex.difficulty && <Badge tone="neutral" size="sm">{EXERCISE_DIFFICULTY_LABEL[ex.difficulty] ?? ex.difficulty}</Badge>}
              {ex.objective && <Badge tone="neutral" size="sm">{EXERCISE_OBJECTIVE_LABEL[ex.objective] ?? ex.objective}</Badge>}
              {!ex.isSystem && <Badge tone="limeSoft" size="sm">Propio</Badge>}
            </div>
            {addContext && (
              <div style={{ marginTop: 10, display: "flex" }}>
                <Button size="sm" variant="secondary" data-stop-card-click="true" onClick={() => onAddToWorkout(ex.id)}>
                  Usar en este entreno
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

