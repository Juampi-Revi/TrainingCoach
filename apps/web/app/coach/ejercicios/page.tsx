"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, Icon } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { useExerciseLibrary } from "./_hooks/use-exercise-library";
import { ExerciseFormModal } from "./_components/exercise-form-modal";
import { ExerciseLibraryGrid } from "./_components/exercise-library-grid";
import { AddToWorkoutBlockModal } from "./_components/add-to-workout-block-modal";
import { ExerciseLibraryFilters, type ExerciseLibraryMediaFilter } from "./_components/exercise-library-filters";
import type { WorkoutTemplateDetail } from "@regen/types";

export default function EjerciciosPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [muscle, setMuscle] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [objective, setObjective] = useState<string>("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [basicsOnly, setBasicsOnly] = useState(false);
  const [media, setMedia] = useState<ExerciseLibraryMediaFilter>("any");
  const [modal, setModal] = useState<{ open: true; exercise?: import("./_hooks/use-exercise-library").ExerciseLibraryItem; tab?: "info" | "media" } | null>(null);

  const addContext = useMemo(() => {
    const templateId = searchParams.get("templateId");
    const blockId = searchParams.get("blockId");
    const context = searchParams.get("context");
    if (!templateId) return null;
    return {
      templateId,
      blockId,
      label: context === "plan" ? "Usar en este plan" : "Usar en este entreno",
    };
  }, [searchParams]);

  const returnTo = useMemo(() => {
    const raw = searchParams.get("returnTo");
    if (!raw) return null;
    if (!raw.startsWith("/")) return null;
    return raw;
  }, [searchParams]);

  const [templateInfo, setTemplateInfo] = useState<{ title: string; blocks: WorkoutTemplateDetail["blocks"] } | null>(null);
  const [blockPicker, setBlockPicker] = useState<{ exerciseId: string } | null>(null);

  useEffect(() => {
    if (!addContext?.templateId) {
      setTemplateInfo(null);
      return;
    }
    api.get<WorkoutTemplateDetail>(`/coach/workouts/${addContext.templateId}`)
      .then((t) => setTemplateInfo({ title: t.title, blocks: t.blocks ?? [] }))
      .catch(() => setTemplateInfo(null));
  }, [api, addContext?.templateId]);

  const query = useMemo(
    () => ({
      q,
      muscles: muscle ? [muscle] : [],
      equipments: equipment ? [equipment] : [],
      difficulties: difficulty ? [difficulty] : [],
      objectives: objective ? [objective] : [],
      favoritesOnly,
      basicsOnly,
      media,
      limit: 60,
    }),
    [q, muscle, equipment, difficulty, objective, favoritesOnly, basicsOnly, media],
  );

  const { items, facets, setFavorite, reload, loadMore, hasMore, loadingMore } = useExerciseLibrary(query);

  const list = items ?? [];

  async function addToWorkout(exerciseId: string, workoutBlockId: string) {
    if (!addContext?.templateId) return;
    try {
      await api.post(`/coach/workouts/${addContext.templateId}/exercises`, { exerciseId, workoutBlockId });
      toast.success("Ejercicio agregado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al agregar");
    }
  }

  return (
    <>
      <DesktopShell
        active="library"
        title="Ejercicios"
        subtitle={`${list.length} ejercicios`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            {returnTo && (
              <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push(returnTo)}>
                Volver
              </Button>
            )}
            <div
              className="coach-header-action-secondary"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: 240, height: 36,
                background: "var(--bg-2)", border: "1px solid var(--line-2)",
                borderRadius: 10, padding: "0 12px",
              }}
            >
              <Icon name="search" size={14} color="var(--text-mute)" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                }}
                placeholder="Buscar ejercicio…"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)",
                }}
              />
            </div>
            <Button size="sm" icon="plus" onClick={() => setModal({ open: true })}>
              Nuevo ejercicio
            </Button>
          </>
        }
      >
        <div className="coach-pad">
          <ExerciseLibraryFilters
            q={q}
            setQ={setQ}
            muscle={muscle}
            setMuscle={setMuscle}
            equipment={equipment}
            setEquipment={setEquipment}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            objective={objective}
            setObjective={setObjective}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            basicsOnly={basicsOnly}
            setBasicsOnly={setBasicsOnly}
            media={media}
            setMedia={setMedia}
            facets={facets ? { muscles: facets.muscles ?? [], equipments: facets.equipments ?? [] } : null}
            onClear={() => {
              setQ("");
              setMuscle("");
              setEquipment("");
              setDifficulty("");
              setObjective("");
              setFavoritesOnly(false);
              setBasicsOnly(false);
              setMedia("any");
            }}
          />

          <ExerciseLibraryGrid
            items={items}
            addContext={addContext}
            onEdit={(ex, tab) => setModal({ open: true, exercise: ex, tab })}
            onToggleFavorite={(exerciseId, next) => void setFavorite(exerciseId, next)}
            onAddToWorkout={(exerciseId) => {
              const blockId = addContext?.blockId;
              if (!addContext?.templateId || !blockId) return;
              void addToWorkout(exerciseId, blockId);
            }}
            onPickBlock={(exerciseId) => {
              if (!addContext?.templateId) return;
              if (!templateInfo) {
                toast.error("Cargando bloques…");
                return;
              }
              setBlockPicker({ exerciseId });
            }}
          />
          {items && hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? "Cargando…" : "Cargar más"}
              </Button>
            </div>
          )}
        </div>
      </DesktopShell>

      <AddToWorkoutBlockModal
        open={!!blockPicker}
        title={templateInfo?.title ?? ""}
        blocks={templateInfo?.blocks ?? []}
        onClose={() => setBlockPicker(null)}
        onSelect={(blockId) => {
          const exId = blockPicker?.exerciseId;
          setBlockPicker(null);
          if (!exId) return;
          void addToWorkout(exId, blockId);
        }}
      />

      {modal && (
        <ExerciseFormModal
          exercise={modal.exercise}
          initialTab={modal.tab}
          equipmentSuggestions={facets?.equipments ?? []}
          onClose={() => setModal(null)}
          onSaved={() => void reload()}
          onDeleted={() => void reload()}
        />
      )}
    </>
  );
}
