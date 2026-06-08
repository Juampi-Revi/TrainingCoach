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
  onPickBlock,
}: {
  items: ExerciseLibraryItem[] | null;
  addContext: { templateId: string; blockId?: string | null; label: string } | null;
  onEdit: (ex: ExerciseLibraryItem, tab?: "info" | "media") => void;
  onToggleFavorite: (exerciseId: string, next: boolean) => void;
  onAddToWorkout: (exerciseId: string) => void;
  onPickBlock: (exerciseId: string) => void;
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
            onEdit(ex, "info");
          }}
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
            cursor: "pointer",
            position: "relative",
          }}
          className="ta-row"
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
            <button
              data-stop-card-click="true"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(ex, !ex.hasImage || !ex.hasVideo ? "media" : "info");
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: 9,
                border: "1px solid var(--line-2)",
                background: !ex.hasImage || !ex.hasVideo ? "rgba(255,181,71,.22)" : "rgba(0,0,0,.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
              aria-label={!ex.hasImage || !ex.hasVideo ? "Completar media" : "Editar ejercicio"}
              title={!ex.hasImage || !ex.hasVideo ? "Completar media" : "Editar ejercicio"}
            >
              <Icon
                name={!ex.hasImage ? "image" : !ex.hasVideo ? "video" : "edit"}
                size={13}
                color={!ex.hasImage || !ex.hasVideo ? "var(--warn)" : "var(--text)"}
              />
            </button>
          )}

          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{ex.name}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {ex.primaryMuscle && <Badge tone="neutral" size="sm">{MUSCLE_LABEL[ex.primaryMuscle] ?? ex.primaryMuscle}</Badge>}
              {ex.equipment && <Badge tone="neutral" size="sm">{ex.equipment}</Badge>}
              {ex.difficulty && <Badge tone="neutral" size="sm">{EXERCISE_DIFFICULTY_LABEL[ex.difficulty] ?? ex.difficulty}</Badge>}
              {ex.objective && <Badge tone="neutral" size="sm">{EXERCISE_OBJECTIVE_LABEL[ex.objective] ?? ex.objective}</Badge>}
              {!ex.isSystem && <Badge tone="limeSoft" size="sm">Propio</Badge>}
              {ex.isBasic && <Badge tone="limeSoft" size="sm" icon="bolt">Básico</Badge>}
              {ex.hasImage !== undefined && (
                <Badge tone={ex.hasImage ? "success" : "warn"} size="sm" icon="image">
                  IMG
                </Badge>
              )}
              {ex.hasVideo !== undefined && (
                <Badge tone={ex.hasVideo ? "success" : "warn"} size="sm" icon="video">
                  VID
                </Badge>
              )}
            </div>
            {addContext && (
              <div style={{ marginTop: 10, display: "flex" }}>
                <Button
                  size="sm"
                  variant="secondary"
                  data-stop-card-click="true"
                  onClick={() => (addContext.blockId ? onAddToWorkout(ex.id) : onPickBlock(ex.id))}
                >
                  {addContext.label}
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
